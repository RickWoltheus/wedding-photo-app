"use client";

import { NextStepProvider, NextStepReact } from "nextstepjs";
import type { Tour } from "nextstepjs";

const ONBOARDING_STEPS: Tour[] = [
  {
    tour: "takingTour",
    steps: [
      {
        icon: null,
        title: "De opdracht",
        content:
          "Hier staat steeds welke foto je moet maken. Volg de opdracht en maak een foto.",
        selector: "#onboarding-assignment",
        side: "bottom",
        showControls: true,
        showSkip: true,
      },
      {
        icon: null,
        title: "Foto maken",
        content: "Tik hier om een foto te maken met je telefoon.",
        selector: "#onboarding-maak-foto",
        side: "bottom",
        showControls: true,
        showSkip: true,
      },
    ],
  },
  {
    tour: "stackTour",
    steps: [
      {
        icon: null,
        title: "Je foto's",
        content:
          "Sleep of tik om door je geprinte foto's te bladeren. Tik op een polaroid om hem fullscreen te bekijken.",
        selector: "#onboarding-stack",
        side: "top",
        showControls: true,
        showSkip: true,
      },
    ],
  },
  {
    tour: "previewTour",
    steps: [
      {
        icon: null,
        title: "Preview",
        content:
          "Tik op de preview of op een polaroid in de stapel om de foto fullscreen te bekijken. Geen goede foto? Gebruik het reset-icoon naast Upload om een andere te nemen.",
        selector: "#onboarding-preview",
        side: "top",
        showControls: true,
        showSkip: true,
      },
    ],
  },
];

export default function NextStepWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextStepProvider>
      <NextStepReact steps={ONBOARDING_STEPS} overlayZIndex={998}>
        {children}
      </NextStepReact>
    </NextStepProvider>
  );
}
