import axios, { type AxiosError, type AxiosRequestConfig } from "axios";
import path from 'path';
import { fileURLToPath } from "url";
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '..', '.env');
dotenv.config({ path: envPath });

type EmailListName = 'signup'

const EMAIL_LISTS = JSON.parse(process.env.EMAIL_LISTS || '{}');

type Contact = {
  email: string;
  platforms?: string[];
}

export async function addContactToList(listName: EmailListName, contact: Contact){
  if (process.env.NODE_ENV !== 'production') {
    console.log('LocalHost Adding contact to list:', listName, contact);
    return;
  }

  const listId = EMAIL_LISTS[listName];
  if (!listId) {
    console.log('Invalid list name:', listName);
    return;
  }

  const data = {
    email_address: contact.email,
    // fields: {
    //   ...(contact.name && {
    //     Name: contact.name,
    //     FirstName: contact.name.split(' ')[0],
    //   }),
    // },
    status: "subscribed"
  };

  // POST is for creating a new contact
  // PUT is for updating an existing contact
  const config: AxiosRequestConfig = {
    method: 'post',
    url: `https://api.emailoctopus.com/lists/${listId}/contacts`,
    headers: {
      'Authorization': `Bearer ${process.env.EMAIL_OCTOPUS_API_KEY}`,
      'Content-Type': 'application/json',
    },
    data,
  };

  try {
    await axios(config);
  } catch (error) {
    const axiosError = error as AxiosError;  
    console.error('Error adding contact to list:', listName, contact, axiosError.response?.data || axiosError.message);
  }
}

export async function removeContactFromList(listName: EmailListName, contact: Contact){
  if (process.env.NODE_ENV !== 'production') {
    console.log('LocalHost Removing contact from list:', listName, contact);
    return;
  }

  const listId = EMAIL_LISTS[listName];
  if (!listId) {
    console.log('Invalid list name:', listName);
    return;
  }

  const data = {
    email_address: contact.email,
    status: "unsubscribed"
  };

  const config: AxiosRequestConfig = {
    method: 'put',
    url: `https://api.emailoctopus.com/lists/${listId}/contacts`,
    headers: {
      'Content-Type': 'application/json',
    },
    data,
  };

  try {
    await axios(config);
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('Error removing contact from list:', listName, contact, axiosError.response?.data || axiosError.message);
  }
}