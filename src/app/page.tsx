"use client";

import Image from "next/image";
import Link from "next/link";
import { Info, ShieldUser, UserRound, Dumbbell } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Home() {
  return (
    <main className="landing-shell relative isolate flex min-h-screen items-center overflow-hidden bg-[#fff4ee] px-5 py-16 text-[#3f0000] sm:px-8 sm:py-20 lg:px-16 lg:py-24 xl:px-[7.5rem]">
      <div aria-hidden className="landing-dots landing-dots-top" />
      <div aria-hidden className="landing-dots landing-dots-bottom" />
      <div aria-hidden className="landing-wave" />

      <section className="relative z-10 mx-auto grid w-full max-w-[1300px] items-center gap-16 lg:grid-cols-[45%_55%] lg:gap-0">
        <div className="mx-auto w-full max-w-[25rem] text-center lg:mx-0 lg:text-left">
          <p className="mb-4 text-base font-bold tracking-[0.02em] text-[#9a3412] sm:text-lg">
            WELCOME TO
          </p>
          <h1 className="font-heading text-[2.7rem] leading-[0.94] font-extrabold tracking-[-0.055em] sm:text-[3.1rem] md:text-[3.5rem] xl:text-[3.65rem]">
            <span className="block">FIT  LIFE</span>
            <span className="landing-gym-gradient block">GYM</span>
          </h1>

          <div className="mt-7 h-1.5 w-12 rounded-full bg-gradient-to-r from-[#ff7146] to-[#ffb196] lg:mt-8" />

          <p className="mt-7 max-w-[23rem] text-base leading-[1.48] font-medium text-[#604b46] sm:text-[1.05rem] lg:mt-8 lg:text-[1.1rem]">
            Manage your members, attendance, payments and gym operations from one powerful dashboard.
          </p>

          <div className="mt-8 flex w-full flex-col gap-3 sm:mx-auto sm:max-w-[21rem] lg:mx-0 lg:mt-9">
            <Button
              render={<Link href="/sign-in" />}
              className="h-[4.1rem] w-full rounded-xl bg-gradient-to-r from-[#c2410c] to-[#ea580c] px-7 text-base font-semibold text-white shadow-[0_14px_26px_rgba(194,65,12,0.2)] transition-transform hover:-translate-y-0.5 hover:from-[#ad370a] hover:to-[#d94f0a] sm:text-lg"
            >
              <ShieldUser className="size-6 stroke-[1.8]" />
              Admin Login
            </Button>

            <Dialog>
              <DialogTrigger
                render={
                  <Button className="h-[4.1rem] w-full rounded-xl border-2 border-[#d84315] bg-white/25 px-7 text-base font-semibold text-[#c2410c] shadow-[0_12px_24px_rgba(154,52,18,0.05)] transition hover:-translate-y-0.5 hover:bg-white/55 sm:text-lg" />
                }
              >
                <UserRound className="size-6 stroke-[1.8]" />
                Member Login
              </DialogTrigger>
              <DialogContent className="gap-5 rounded-2xl border border-[#ffcfbb] bg-[#fffaf7] p-7 text-[#3f0000] shadow-2xl sm:max-w-md">
                <DialogHeader className="gap-3">
                  <DialogTitle className="text-2xl font-bold">Coming Soon</DialogTitle>
                  <DialogDescription className="text-base leading-relaxed text-[#765b54]">
                    Member Portal is currently under development. It will be available in a future update.
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </div>

          <p className="mt-7 flex items-center justify-center gap-3 text-sm font-medium text-[#604b46] lg:justify-start">
            <span className="flex size-8 items-center justify-center rounded-full bg-[#ffe1d3] text-[#e65325]">
              <Info className="size-4" />
            </span>
            Member portal is coming soon.
          </p>
        </div>

        <div className="relative mx-auto flex w-full max-w-[32rem] items-center justify-center pb-16 sm:pb-20 lg:max-w-none lg:translate-x-[4%] lg:pb-0">
          <div aria-hidden className="landing-oval absolute h-[15rem] w-[15rem] sm:h-[20rem] sm:w-[20rem] md:h-[24rem] md:w-[24rem] lg:h-[min(39vw,28rem)] lg:w-[min(39vw,28rem)]" />
<div className="relative w-[24rem] h-[24rem] sm:w-[28rem] sm:h-[28rem] lg:w-[30rem] lg:h-[30rem] flex items-center justify-center">
  <Image
    src="/logoo.png"
    alt="Fit Life Gym logo"
    fill
    priority
    className="object-contain scale-[1.0] drop-shadow-[0_25px_35px_rgba(255,102,0,0.22)]"
  />
</div>
        </div>
      </section>
    </main>
  );
}
