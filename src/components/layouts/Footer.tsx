import { FC } from 'react';
import { buildImageUrl } from '@/lib/utils/imageUtils';

interface FooterProps {
  footerImage?: string;
}

const Footer: FC<FooterProps> = ({ footerImage }) => {
  const processedFooterUrl = buildImageUrl(footerImage);
  
  if (!processedFooterUrl) return null;

  return (
    <footer className="pt-12 pb-6">
      <img src={processedFooterUrl} alt="Footer" className="w-full object-cover rounded-t-xl" />
    </footer>
  );
};

export default Footer;
