"use client";
import { useParams } from "next/navigation";
import { SurveyBuilder } from "@/components/SurveyBuilder";
export default function EditSurveyPage() {
  const { id } = useParams<{ id: string }>();
  return <SurveyBuilder id={id} />;
}
