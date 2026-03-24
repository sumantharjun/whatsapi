import "../styles/globals.css";
import "../styles/admin.css";
import Head from "next/head";
import { AuthProvider } from "../contexts/AuthContext";
import { ToastProvider } from "../contexts/ToastContext";

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <Head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap" />
        </Head>
        <div style={{ minHeight: '100vh' }}>
          <Component {...pageProps} />
        </div>
      </ToastProvider>
    </AuthProvider>
  );
}
