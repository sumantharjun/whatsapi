import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0f172a" />
      </Head>
      <body style={{ margin: 0, minHeight: '100vh', background: '#f8fafc' }} className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
