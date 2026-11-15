This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Analytics

Online booking analytics stays off until these public variables are set in Vercel (Preview and Production). No measurement IDs are stored in the repo. See `.env.example`.

- `NEXT_PUBLIC_GA4_ID` — Google Analytics 4 measurement ID (`G-XXXXXXXX`). Leave unset to skip the Google tag.
- `NEXT_PUBLIC_META_PIXEL_ID` — Meta Pixel ID (digits only). Leave unset to skip the Meta Pixel.

After the website booking API confirms a booking, the page sends a GA4 event named `booking_completed` and a Meta standard event named `Schedule`. Both include the appointment type (`alteration`, `wedding_dress`, or `tuxedo`) plus `utm_source`, `utm_medium`, `utm_campaign`, and the landing referrer. They do not include the customer’s name, email, phone, or notes. Phone bookings made by Sofia are not sent to either tool.
