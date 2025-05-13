type Props = { footerImage: string };

export default function Footer({ footerImage }: Props) {
  return (
    <div className="mt-12">
      {footerImage && <img src={footerImage} alt="Footer" className="w-full" />}
    </div>
  );
}
