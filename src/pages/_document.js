import { Html, Head, Main, NextScript } from "next/document";

import { useState, useEffect } from "react";

export default function Document() {
  const [isStandalone, setIsStandalone] = useState(false);
  useEffect(() => {
    if (window.navigator.standalone) {
      setIsStandalone(true);
    }
  }, []);

  return (
    <Html lang="en">
      <Head />
      <body id={isStandalone ? "standalone" : "body"}>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}