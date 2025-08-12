export default async function PosterPage({ searchParams }: { searchParams: Promise<{ text: string }> }) {
  const text = (await searchParams).text ?? '';

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-black"
    >
      <div
        className="flex items-center justify-center w-[1080px] h-[1080px] bg-[#7C3AED] shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
      >
        <p className="text-white text-4xl font-bold">{text}</p>
      </div>
    </div>
  );
}

