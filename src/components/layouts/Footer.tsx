import { FC } from 'react';

interface FooterProps {
  footerImage?: string;
}

const Footer: FC<FooterProps> = ({ footerImage }) => {
  if (!footerImage) return null;

  return (
    <footer className="pt-12 pb-6">
      <img src={footerImage} alt="Footer" className="w-full object-cover rounded-t-xl" />
    </footer>
  );
};

export default Footer;
