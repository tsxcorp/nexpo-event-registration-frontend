type HeroProps = {
  banner: string;
  logo: string;
  slogan?: string;
};

export default function Hero({ banner, logo, slogan }: HeroProps) {
  return (
    <section
      className="relative h-[60vh] md:h-[75vh] w-full bg-cover bg-center flex items-center justify-center"
      style={{ backgroundImage: `url(${banner})` }}
    >
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 text-center text-white">
        {logo && (
          <img
            src={logo}
            alt="Nexpo Logo"
            className="h-24 md:h-32 mx-auto mb-4 drop-shadow-lg"
          />
        )}
        <h1 className="text-3xl md:text-5xl font-bold leading-tight">
          {slogan || "GIẢI PHÁP TOÀN DIỆN CHO SỰ KIỆN & TRIỂN LÃM"}
        </h1>
      </div>
    </section>
  );
}
