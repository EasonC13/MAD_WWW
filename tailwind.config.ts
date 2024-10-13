import type { Config } from "tailwindcss";
const flowbite = require("flowbite-react/tailwind");

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    flowbite.content()
  ],
  theme: {
    extend: {
      colors: {
        "custom-blue": "rgb(174 236 255 / var(--tw-bg-opacity))",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "stroke-decoration":
          "conic-gradient(from 202deg at 50% 50%, #202F34 42.57809400558472deg, #65E0FC 94.842449426651deg, #A7EDFD 106.2618899345398deg, #65E0FC 119.4994604587555deg, #202F34 187.49999284744263deg, #202F34 260.7220673561096deg, #9BEEFF 286.23008966445923deg, #202F34 308.08024406433105deg)",
      },
    },
  },
  plugins: [
    flowbite.plugin()
  ],
};
export default config;
