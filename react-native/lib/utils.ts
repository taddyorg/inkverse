import { Linking } from 'react-native';

interface OpenURLProps {
  url: string;
}

interface OpenEmailProps {
  toAddress: string;
  subject?: string;
  body?: string;
}

export async function openURL({ url }: OpenURLProps) {
  try {
    await Linking.openURL(url);
  } catch (error) {
    console.error('Error opening URL:', error);
  }
}

export async function openEmail({ toAddress, subject, body }: OpenEmailProps) {
  const params = [
    ...(subject ? [`subject=${encodeURIComponent(subject)}`] : []),
    ...(body ? [`body=${encodeURIComponent(body)}`] : [])
  ];
  
  const queryString = params.length > 0 ? `?${params.join('&')}` : '';
  const mailtoUrl = `mailto:${toAddress}${queryString}`;
  
  try {
    await Linking.openURL(mailtoUrl);
  } catch (error) {
    console.error('Error opening email:', error);
  }
} 