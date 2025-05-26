type Props = {
  name: string;
  description: string;
};

export default function EventInfo({ name, description }: Props) {
  return (
    <section className="py-16 px-4 max-w-5xl mx-auto text-gray-800">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">{name}</h2>
      <div
        className="prose prose-lg mx-auto text-justify"
        dangerouslySetInnerHTML={{ __html: description }}
      />
    </section>
  );
}
