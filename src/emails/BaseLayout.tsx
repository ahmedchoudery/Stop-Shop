import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Preview,
} from '@react-email/components';

interface BaseLayoutProps {
  previewText: string;
  title: string;
  children: React.ReactNode;
}

export const BaseLayout: React.FC<BaseLayoutProps> = ({
  previewText,
  title,
  children,
}) => {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logoText}>STOP &amp; SHOP</Text>
            <Text style={logoSubtitle}>PREMIUM MENSWEAR</Text>
          </Section>

          {/* Content */}
          <Section style={contentSection}>
            <Text style={heading}>{title}</Text>
            {children}
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              STOP &amp; SHOP &nbsp;&middot;&nbsp; GUJRAT &nbsp;&middot;&nbsp; KARACHI, PAKISTAN
            </Text>
            <Text style={footerSubtitle}>
              Need help? Reach out at <Link href="mailto:support@stopandshop.pk" style={footerLink}>support@stopandshop.pk</Link> or via <Link href="https://wa.me/923001234567" style={footerLink}>WhatsApp Support</Link>.
            </Text>
            <Text style={footerDisclaimer}>
              This is an automated transaction message. Please do not reply directly to this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default BaseLayout;

const main = {
  backgroundColor: '#fafafa',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  margin: '0',
  padding: '40px 20px',
  color: '#111827',
};

const container = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '4px',
  overflow: 'hidden',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)',
};

const header = {
  backgroundColor: '#0d0d0d',
  padding: '24px',
  textAlign: 'center' as const,
  borderBottom: '2px solid #ba1f3d',
};

const logoText = {
  margin: '0',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '900',
  letterSpacing: '5px',
  textTransform: 'uppercase' as const,
  textAlign: 'center' as const,
};

const logoSubtitle = {
  margin: '4px 0 0',
  color: '#a3a3a3',
  fontSize: '8px',
  fontWeight: '700',
  letterSpacing: '3px',
  textTransform: 'uppercase' as const,
  textAlign: 'center' as const,
};

const contentSection = {
  padding: '40px 32px',
};

const heading = {
  margin: '0 0 24px',
  fontSize: '18px',
  fontWeight: '900',
  letterSpacing: '-0.5px',
  textTransform: 'uppercase' as const,
  color: '#0d0d0d',
  borderBottom: '1px solid #f3f4f6',
  paddingBottom: '12px',
};

const footer = {
  backgroundColor: '#0d0d0d',
  padding: '24px',
  textAlign: 'center' as const,
  borderTop: '1px solid #1f1f1f',
};

const footerText = {
  margin: '0',
  color: '#737373',
  fontSize: '9px',
  fontWeight: '700',
  letterSpacing: '2px',
  textTransform: 'uppercase' as const,
};

const footerSubtitle = {
  margin: '8px 0 0',
  color: '#a3a3a3',
  fontSize: '10px',
  lineHeight: '1.4',
};

const footerLink = {
  color: '#ba1f3d',
  textDecoration: 'none',
  fontWeight: 'bold',
};

const footerDisclaimer = {
  margin: '12px 0 0',
  color: '#404040',
  fontSize: '8px',
  fontWeight: '500',
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
};
