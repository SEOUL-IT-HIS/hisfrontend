"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { Button } from "@/components/common";

const POSTCODE_SCRIPT_URL =
  "https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

type PostcodeResult = {
  zonecode: string;
  address: string;
  roadAddress: string;
  jibunAddress: string;
  userSelectedType: "R" | "J";
};

type KakaoPostcode = {
  open: () => void;
};

type KakaoPostcodeConstructor = new (options: {
  oncomplete: (data: PostcodeResult) => void;
}) => KakaoPostcode;

type PostcodeWindow = Window & {
  daum?: {
    Postcode?: KakaoPostcodeConstructor;
  };
  kakao?: {
    Postcode?: KakaoPostcodeConstructor;
  };
};

type PostcodeSearchButtonProps = {
  disabled?: boolean;
  onSelect: (result: { zipCode: string; address: string }) => void;
};

function getPostcodeConstructor() {
  const postcodeWindow = window as PostcodeWindow;

  return postcodeWindow.kakao?.Postcode ?? postcodeWindow.daum?.Postcode;
}

export default function PostcodeSearchButton({
  disabled = false,
  onSelect,
}: PostcodeSearchButtonProps) {
  const [scriptReady, setScriptReady] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  const readinessTimerRef = useRef<number | null>(null);

  const waitForPostcode = useCallback(() => {
    if (readinessTimerRef.current !== null) {
      window.clearInterval(readinessTimerRef.current);
      readinessTimerRef.current = null;
    }

    setScriptError(false);

    if (getPostcodeConstructor()) {
      setScriptReady(true);
      return;
    }

    setScriptReady(false);

    let attempts = 0;
    readinessTimerRef.current = window.setInterval(() => {
      attempts += 1;

      if (getPostcodeConstructor()) {
        window.clearInterval(readinessTimerRef.current!);
        readinessTimerRef.current = null;
        setScriptReady(true);
        return;
      }

      if (attempts >= 50) {
        window.clearInterval(readinessTimerRef.current!);
        readinessTimerRef.current = null;
        setScriptError(true);
      }
    }, 100);
  }, []);

  useEffect(() => {
    // The script may already be loaded when this component mounts during
    // client-side navigation, so do not rely only on Script's onReady event.
    waitForPostcode();

    return () => {
      if (readinessTimerRef.current !== null) {
        window.clearInterval(readinessTimerRef.current);
        readinessTimerRef.current = null;
      }
    };
  }, [waitForPostcode]);

  const openPostcodeSearch = () => {
    const Postcode = getPostcodeConstructor();

    if (!Postcode) {
      waitForPostcode();
      return;
    }

    new Postcode({
      oncomplete: (data) => {
        const selectedAddress =
          data.userSelectedType === "R"
            ? data.roadAddress
            : data.jibunAddress;

        onSelect({
          zipCode: data.zonecode,
          address: selectedAddress || data.address,
        });
      },
    }).open();
  };

  return (
    <>
      <Script
        src={POSTCODE_SCRIPT_URL}
        strategy="afterInteractive"
        onReady={waitForPostcode}
        onError={() => setScriptError(true)}
      />

      <Button
        type="button"
        variant="secondary"
        onClick={openPostcodeSearch}
        disabled={disabled || !scriptReady || scriptError}
        className="shrink-0"
      >
        {scriptError
          ? "Address Search Unavailable"
          : scriptReady
            ? "Search Address"
            : "Loading Address Search..."}
      </Button>
    </>
  );
}
