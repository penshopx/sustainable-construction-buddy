import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, Newspaper } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatAgendaDate, formatInformationDate, type InformationAgenda, type InformationArticle } from "@/lib/informationCenter";

export default function InformationLandingSection() {
  const [articles, setArticles] = useState<InformationArticle[]>([]);
  const [agendas, setAgendas] = useState<InformationAgenda[]>([]);

  useEffect(() => {
    const load = async () => {
      const [articleResult, agendaResult] = await Promise.all([
        supabase
          .from("information_articles")
          .select("*, information_sources(name, domain, trust_level)")
          .order("published_at", { ascending: false })
          .limit(3),
        supabase
          .from("aspekindo_learning_agendas")
          .select("*")
          .gte("start_date", new Date().toISOString().slice(0, 10))
          .order("start_date", { ascending: true })
          .limit(2),
      ]);
      if (!articleResult.error) setArticles(articleResult.data as InformationArticle[]);
      if (!agendaResult.error) setAgendas(agendaResult.data);
    };
    void load();
  }, []);

  if (articles.length === 0 && agendas.length === 0) return null;

  return (
    <section className="bg-[hsl(205,45%,97%)] py-20">
      <div className="container mx-auto px-6">
        <div className="flex flex-col gap-5 border-b border-slate-300 pb-7 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold tracking-[0.18em] text-pub-sky">PUSAT INFORMASI</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-extrabold text-pub-navy md:text-5xl">Pembaruan yang membantu BUJK mengambil langkah berikutnya.</h2>
          </div>
          <Button asChild className="shrink-0 gap-2 bg-pub-sky text-pub-navy hover:bg-pub-sky/90">
            <Link to="/informasi">Lihat semua informasi <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {articles.map((article) => (
            <article key={article.id} className="border-l-4 border-pub-sky bg-white p-6 shadow-card">
              <Newspaper className="h-5 w-5 text-pub-sky" />
              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-500">{article.topic} · {formatInformationDate(article.published_at)}</p>
              <h3 className="mt-3 text-xl font-bold leading-snug text-pub-navy"><Link to={`/informasi/${article.slug}`} className="hover:text-pub-sky">{article.title}</Link></h3>
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">{article.summary}</p>
            </article>
          ))}
          {agendas.map((agenda) => (
            <article key={agenda.id} className="border-l-4 border-pub-amber bg-white p-6 shadow-card">
              <CalendarDays className="h-5 w-5 text-pub-amber" />
              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-500">{formatAgendaDate(agenda.start_date)} · {agenda.category}</p>
              <h3 className="mt-3 text-xl font-bold leading-snug text-pub-navy">
                <Link to="/agenda-pub" className="hover:text-pub-sky">{agenda.title}</Link>
              </h3>
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">{agenda.description}</p>
              <Link to="/agenda-pub" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-pub-sky hover:underline">
                Lihat agenda PUB <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}