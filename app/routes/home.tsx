import type { Route } from "./+types/home";
import { Landing } from "../Landing/landing";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Microfiber App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return <Landing />;
}
