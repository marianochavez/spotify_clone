"use client";

import { useEffect, useState } from "react";

import { ProductWithPrice } from "@/types";
import AuthModal from "@/components/AuthModal";

type ModalProviderProps = {
  //   products: ProductWithPrice[];
};

const ModalProvider = ({}: ModalProviderProps) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // disable ssr
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <AuthModal />
      {/* <SubscribeModal products={products} /> */}
      {/* <UploadModal /> */}
    </>
  );
};

export default ModalProvider;
