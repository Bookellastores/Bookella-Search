import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini client. It will automatically use the GEMINI_API_KEY environment variable.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/*
 * Frontend Debouncing Tip:
 * To prevent spamming this API on every keystroke and hitting rate limits (like HTTP 429),
 * implement a debounce on the client side. E.g. in React:
 * 
 * import { useState, useEffect } from 'react';
 * export function useDebounce(value, delay = 500) {
 *   const [debouncedValue, setDebouncedValue] = useState(value);
 *   useEffect(() => {
 *     const handler = setTimeout(() => setDebouncedValue(value), delay);
 *     return () => clearTimeout(handler);
 *   }, [value, delay]);
 *   return debouncedValue;
 * }
 * 
 * Then only call the API when debouncedValue changes.
 */

// Helper to gracefully fetch and avoid crashing on failures (e.g., 429 Too Many Requests)
async function safeFetch(url: string, asJson: boolean = true, options: RequestInit = {}) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      return { error: `HTTP ${res.status}`, status: res.status };
    }
    if (asJson) {
      return await res.json();
    } else {
      return await res.text();
    }
  } catch (error: any) {
    return { error: 'Fetch failed', details: error.message };
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const title = body?.title;

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'A valid book title is required' },
        { status: 400 }
      );
    }

    const encodeQuery = encodeURIComponent(title);

    // 1. Google Books API (with optional API key support)
    const googleBooksKey = process.env.GOOGLE_BOOKS_API_KEY ? `&key=${process.env.GOOGLE_BOOKS_API_KEY}` : '';
    const googleBooksUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeQuery}&maxResults=1${googleBooksKey}`;
    const googleBooksPromise = safeFetch(googleBooksUrl, true);

    // 2. Open Library API
    const openLibraryPromise = safeFetch(`https://openlibrary.org/search.json?title=${encodeQuery}&limit=1`, true);

    // 3. Noor Book Scraping
    const noorBookPromise = safeFetch(`https://www.noor-book.com/search?q=${encodeQuery}`, false, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    }).then(result => {
      if (typeof result === 'string') {
        const $ = cheerio.load(result);
        return { scrapedText: $('body').text().replace(/\s\s+/g, ' ').substring(0, 5000) };
      }
      return result; // contains error object if failed
    });

    // 4. Aseer Alkotb Scraping
    const aseerAlkotbPromise = safeFetch(`https://aseeralkotb.com/search?q=${encodeQuery}`, false, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    }).then(result => {
      if (typeof result === 'string') {
        const $ = cheerio.load(result);
        return { scrapedText: $('body').text().replace(/\s\s+/g, ' ').substring(0, 5000) };
      }
      return result; // contains error object if failed
    });

    // Execute concurrently, using allSettled to prevent failures in one source from crashing others
    const results = await Promise.allSettled([
      googleBooksPromise,
      openLibraryPromise,
      noorBookPromise,
      aseerAlkotbPromise
    ]);

    // Aggregate raw data
    const aggregatedData = {
      source: "Aggregation",
      queryTitle: title,
      googleBooks: results[0].status === 'fulfilled' ? results[0].value : { error: String(results[0].reason) },
      openLibrary: results[1].status === 'fulfilled' ? results[1].value : { error: String(results[1].reason) },
      noorBookScrapedText: results[2].status === 'fulfilled' ? results[2].value : { error: String(results[2].reason) },
      aseerAlkotbScrapedText: results[3].status === 'fulfilled' ? results[3].value : { error: String(results[3].reason) }
    };

    const rawDataString = JSON.stringify(aggregatedData);

    const systemPrompt = `You are a highly skilled Book Metadata Expert. 
Your task is to analyze the provided raw data from 4 different sources (Google Books API, Open Library API, Noor Book scraped text, and Aseer Alkotb scraped text).
Based on this raw data, extract the most accurate information for the requested book.
Please follow these EXACT instructions:
1. Extract the most accurate Title, Author, Page Count (as a number), and Category.
2. Extract the ISBN (ISBN-10 or ISBN-13). Look carefully through all the source data for this. If multiple exist, prefer ISBN-13.
3. Extract the highest quality Cover Image URL from the sources.
4. Write a completely new, engaging 2-to-3 sentence Book Summary in Arabic, regardless of the original language of the book. Do not just copy text verbatim; generate a well-written summary.
5. If the book genuinely appears to not exist across any of the sources, respond with exactly: {"error": "Book not found"}

Return ONLY a structured JSON object matching this schema exactly (if unable to find a property, set its value to null):
{
  "title": "String",
  "author": "String",
  "category": "String",
  "pageCount": Number,
  "isbn": "String or null",
  "coverImage": "String or null",
  "arabicSummary": "String"
}`;

    // Generate content with Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        { role: 'user', parts: [{ text: `System Instructions: ${systemPrompt}\n\nRaw Data:\n${rawDataString}` }] }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const geminiOutput = response.text;
    let finalJson;

    try {
      finalJson = geminiOutput ? JSON.parse(geminiOutput) : { error: "No response from Gemini" };
    } catch (parseError) {
      // Clean up markdown markers if present
      const cleanJsonStr = geminiOutput?.replace(/^```json/i, '').replace(/```$/i, '').trim() || "{}";
      finalJson = JSON.parse(cleanJsonStr);
    }

    if (finalJson.error) {
      return NextResponse.json(finalJson, { status: 404 });
    }

    return NextResponse.json(finalJson, { status: 200 });

  } catch (error: any) {
    console.error("Fetch book error:", error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
