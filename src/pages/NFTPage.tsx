import { Card, Typography, Row, Col, Empty } from 'antd';
import { PictureOutlined } from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';

// 色彩主题定义
const COLORS = {
  primary: '#1890ff',
  success: '#52c41a',
  warning: '#faad14',
  error: '#ff4d4f',
  info: '#13c2c2',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.8)',
  textTertiary: 'rgba(255, 255, 255, 0.6)',
  backgroundPrimary: 'rgba(255, 255, 255, 0.05)',
  backgroundSecondary: 'rgba(255, 255, 255, 0.02)',
  border: 'rgba(255, 255, 255, 0.1)',
  badgeMember: '#faad14',
  badgeCity: '#1890ff',
  badgeProvince: '#722ed1',
  badgeNational: '#eb2f96'
};

// 统一样式常量
const CARD_STYLE = {
  backgroundColor: COLORS.backgroundPrimary,
  borderRadius: '12px',
  border: `1px solid ${COLORS.border}`,
  backdropFilter: 'blur(10px)',
  transition: 'all 0.3s ease-in-out, transform 0.3s ease-out, box-shadow 0.3s ease-out',
  transform: 'translateY(0)',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  color: COLORS.textPrimary,
};

const CARD_HEAD_STYLE = {
  color: COLORS.textPrimary,
  borderBottom: `1px solid ${COLORS.border}`,
  fontSize: '16px',
  fontWeight: 'bold',
  lineHeight: '1.5'
};

const CARD_MARGIN_BOTTOM = '24px';

// 排版常量
const FONT_SIZES = {
  titleLarge: '24px',
  titleMedium: '20px',
  titleSmall: '16px',
  subtitle: '14px',
  bodyLarge: '16px',
  bodyMedium: '14px',
  bodySmall: '12px'
};

const LINE_HEIGHTS = {
  title: '1.3',
  body: '1.6'
};

const { Title, Text } = Typography;

const NFTPage = () => {
  const { t } = useLanguage();
  
  return (
    <div style={{ padding: '20px', backgroundColor: '#000000', minHeight: 'calc(100vh - 180px)' }}>
      <Title level={2} style={{ 
        color: COLORS.textPrimary, 
        textAlign: 'center', 
        marginBottom: '30px',
        fontSize: FONT_SIZES.titleLarge,
        fontWeight: 'bold',
        lineHeight: LINE_HEIGHTS.title
      }}>
        <PictureOutlined style={{ marginRight: '10px', fontSize: FONT_SIZES.titleMedium }} />
        {t('nft')}
      </Title>

      <Row gutter={[16, 16]} style={{ marginBottom: CARD_MARGIN_BOTTOM }}>
        <Col xs={24} sm={24} md={24} lg={24} xl={24}>
          <Card 
            title={t('nftFunction')} 
            style={{ 
              ...CARD_STYLE, 
              marginBottom: CARD_MARGIN_BOTTOM,
              backgroundColor: COLORS.backgroundPrimary,
            }}
            headStyle={CARD_HEAD_STYLE}
            hoverable
          >
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              padding: '60px 20px',
              textAlign: 'center'
            }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Text style={{ 
                    color: COLORS.textSecondary, 
                    fontSize: FONT_SIZES.bodyLarge,
                    lineHeight: LINE_HEIGHTS.body
                  }}>
                    {t('underDevelopment')}
                  </Text>
                }
                style={{ marginTop: '20px' }}
              />
              <Text style={{ 
                color: COLORS.textTertiary, 
                fontSize: FONT_SIZES.bodyMedium, 
                lineHeight: LINE_HEIGHTS.body,
                marginTop: '16px',
                maxWidth: '400px'
              }}>
                {t('comingSoon')}
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default NFTPage;