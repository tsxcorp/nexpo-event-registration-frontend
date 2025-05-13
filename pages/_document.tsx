import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="vi">
      <Head>
        {/* ✅ Favicon mới */}
        <link rel="icon" href="/nexpo-favicon.ico" type="image/x-icon" />

        {/* Meta tags nếu muốn */}
        <meta name="theme-color" content="#002E5D" />
        <meta name="description" content="NEXPO Event Registration" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
