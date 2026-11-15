/**
 * Read a phone number from a calendar description line such as "Phone: ...".
 * A digit is required so a channel label like "Source: phone (Sofia)" is not
 * stored as the customer's number.
 */
export function phoneFromDescription(description: string): string {
  const match = description.match(
    /(?:Phone|Tel|Telephone|Cell|Mobile)[:\s]+(?=[+\d\s\-().]*\d)([+\d\s\-().]+)/i,
  )
  return match ? match[1].trim() : ''
}
