"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const HeroSection = () => {
  // const imageRef = useRef(null);

  // useEffect(() => {
  //   const imageElement = imageRef.current;

  //   const handleScroll = () => {
  //     const scrollPosition = window.scrollY;
  //     const scrollThreshold = 100;

  //     if (scrollPosition > scrollThreshold) {
  //       imageElement.classList.add("scrolled");
  //     } else {
  //       imageElement.classList.remove("scrolled");
  //     }
  //   };

  //   window.addEventListener("scroll", handleScroll);
  //   return () => window.removeEventListener("scroll", handleScroll);
  // }, []);

  return (
    <section className="pt-40 pb-20 px-4">
      <div className="container mx-auto text-center">
        <h1 className="text-3xl md:text-6xl pb-6 gradient-title font-arial">
          Manage Your Everyday Finances <br/> with Intelligence
        </h1>
        <p className="text-sm text-gray-600 mb-8 md:text-xl">
          Smarter money management with AI <br /> track, analyze, and optimize your finances in real time.
        </p>
        <div className="flex justify-center space-x-4">
          <Link href="/dashboard">
            <Button size="lg" className="px-8 cursor-pointer">
              Get Started
            </Button>
          </Link>
        </div>
        <div className="mt-5 md:mt-3">
          <div>
            <Image
              src="/banner.jpeg"
              width={1200}
              height={780}
              alt="Dashboard Preview"
              className="rounded-lg shadow-2xl border mx-auto"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;