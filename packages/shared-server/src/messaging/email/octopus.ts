import axios, { type AxiosError, type AxiosRequestConfig } from "axios";

enum EmailListName {
  SIGNUP = "signup",
}

const EMAIL_LISTS = JSON.parse(process.env.EMAIL_LISTS || '{}');

type Contact = {
  name: string;
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
    api_key: process.env.EMAIL_OCTOPUS_API_KEY,
    email_address: contact.email,
    fields: {
      ...(contact.name && {
        Name: contact.name,
        FirstName: contact.name.split(' ')[0],
      }),
    },
    ...(contact.platforms?.length && { platforms: contact.platforms }),
    status: "SUBSCRIBED"
  };

  const config: AxiosRequestConfig = {
    method: 'post',
    url: `https://emailoctopus.com/api/1.6/lists/${listId}/contacts`,
    headers: {
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