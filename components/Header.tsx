type Props = { logo: string };

export default function Header({ logo }: Props) {
  return (
    <div className="flex justify-center py-4 bg-white shadow">
      {logo && <img src={logo} alt="Logo" className="h-16" />}
    </div>
  );
}
