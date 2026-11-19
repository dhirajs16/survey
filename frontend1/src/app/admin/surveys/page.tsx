"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Survey } from "@/lib/types";
import { SurveyList } from "@/components/SurveyList";
import { Icon } from "@/components/Icons";
import { LoadingSpinner } from "@/components/LoadingSpinner";
export default function SurveysPage() {
  const [items, setItems] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => {
    api
      .surveys()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);
  return (
    <>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold">Surveys</h1>
          <p className="mt-2 text-slate-500">
            Create, publish, and manage all your surveys.
          </p>
        </div>
        <Link href="/admin/surveys/new" className="btn btn-primary">
          <Icon name="plus" />
          Create survey
        </Link>
      </div>
      {loading ? (
        <LoadingSpinner label="Loading surveys…" />
      ) : (
        <SurveyList surveys={items} onChange={load} />
      )}
    </>
  );
}
