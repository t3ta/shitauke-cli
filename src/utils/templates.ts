import fs from 'fs-extra';
import { getConfig } from './config.js';
import { Template } from '../models/types.js';

/**
 * Get all templates
 */
export async function getTemplates(): Promise<Record<string, Template>> {
  try {
    const config = await getConfig();
    const templatesFile = config.templates_file;
    
    if (!await fs.pathExists(templatesFile)) {
      await fs.writeJson(templatesFile, {}, { spaces: 2 });
      return {};
    }
    
    return await fs.readJson(templatesFile);
  } catch (error) {
    console.error('Error reading templates:', error);
    return {};
  }
}

/**
 * Get a template by name
 */
export async function getTemplate(name: string): Promise<Template | null> {
  try {
    const templates = await getTemplates();
    return templates[name] || null;
  } catch (error) {
    console.error('Error getting template:', error);
    return null;
  }
}

/**
 * Add or update a template
 */
export async function saveTemplate(
  name: string,
  prompt: string,
  description?: string
): Promise<Template> {
  try {
    const config = await getConfig();
    const templatesFile = config.templates_file;
    
    const templates = await getTemplates();
    
    const template: Template = {
      name,
      prompt,
      description
    };
    
    templates[name] = template;
    
    await fs.writeJson(templatesFile, templates, { spaces: 2 });
    
    return template;
  } catch (error) {
    console.error('Error saving template:', error);
    throw error;
  }
}

/**
 * Delete a template by name
 */
export async function deleteTemplate(name: string): Promise<boolean> {
  try {
    const config = await getConfig();
    const templatesFile = config.templates_file;
    
    const templates = await getTemplates();
    
    if (!templates[name]) {
      return false; // Template not found
    }
    
    delete templates[name];
    
    await fs.writeJson(templatesFile, templates, { spaces: 2 });
    
    return true;
  } catch (error) {
    console.error('Error deleting template:', error);
    return false;
  }
}
