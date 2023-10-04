export default function getFlagEmoji(countryCode: string) {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    //@ts-ignore
    .map(char => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}