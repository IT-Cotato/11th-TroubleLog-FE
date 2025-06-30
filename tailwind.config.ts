import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#9737FD",
        subColor1: "#E4CBFE",
        subColor2: "#F5ECFF",
        subColor3: "#FFDC69",

        gray4: "#525252",
        gray3: "#7A7A7A",
        gray2: "#B8B8B8",
        gray1: "#E0E0E0",

        status: {
          inProgress: "#FFEA65",
          complete: "#00B279",
          created: "#009DF1",
        },
      },
      fontFamily: {
        sans: ["Pretendard", "sans-serif"],
      },
      boxShadow: {
        card: "1px 1px 8px 0px rgba(0, 0, 0, 0.25)",
      },
      zIndex: {
        max: "9999", // 모달 등 우선순위용
      },
    },
  },
  plugins: [],
} satisfies Config;
