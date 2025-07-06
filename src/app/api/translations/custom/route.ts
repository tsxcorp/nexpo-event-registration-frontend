import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const TRANSLATIONS_FILE = path.join(process.cwd(), 'data', 'custom-translations.json');

// Ensure data directory exists
async function ensureDataDirectory() {
  const dataDir = path.dirname(TRANSLATIONS_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Load custom translations from file
async function loadCustomTranslations() {
  try {
    await ensureDataDirectory();
    const data = await fs.readFile(TRANSLATIONS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return empty object
    return {};
  }
}

// Save custom translations to file
async function saveCustomTranslations(translations: any) {
  await ensureDataDirectory();
  await fs.writeFile(TRANSLATIONS_FILE, JSON.stringify(translations, null, 2));
}

export async function GET() {
  try {
    const translations = await loadCustomTranslations();
    return NextResponse.json(translations);
  } catch (error) {
    console.error('Error loading custom translations:', error);
    return NextResponse.json({ error: 'Failed to load translations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const translations = await request.json();
    await saveCustomTranslations(translations);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving custom translations:', error);
    return NextResponse.json({ error: 'Failed to save translations' }, { status: 500 });
  }
} 