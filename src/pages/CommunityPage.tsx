import { Card, Typography, Row, Col, Empty } from 'antd';
import { TeamOutlined } from '@ant-design/icons';
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

const CommunityPage = () => {
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
        <TeamOutlined style={{ marginRight: '10px', fontSize: FONT_SIZES.titleMedium }} />
        {t('community')}
      </Title>

      <Row gutter={[16, 16]} style={{ marginBottom: CARD_MARGIN_BOTTOM }}>
        <Col xs={24} sm={24} md={24} lg={24} xl={24}>
          <Card 
            title={t('communityFunction')} 
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

      {/* 招聘信息 */}
      <Row gutter={[16, 16]} style={{ marginBottom: CARD_MARGIN_BOTTOM }}>
        <Col xs={24} sm={24} md={24} lg={24} xl={24}>
          <Card 
            title={t('recruitment')} 
            style={{ 
              ...CARD_STYLE, 
              marginBottom: CARD_MARGIN_BOTTOM,
              backgroundColor: COLORS.backgroundPrimary,
            }}
            headStyle={CARD_HEAD_STYLE}
            hoverable
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Text strong style={{ color: '#ffffff' }}>{t('smartContractDeployed')}</Text>
                  <Text style={{ color: '#ffffff' }}>✅</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Text strong style={{ color: '#ffffff' }}>{t('dappV1Launched')}</Text>
                  <Text style={{ color: '#ffffff' }}>✅</Text>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Text strong style={{ color: COLORS.textPrimary }}>{t('workStyle')}</Text>
                  <Text style={{ color: COLORS.textSecondary }}>{t('remoteWork')}</Text>
                </div>
                
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <Text strong style={{ color: COLORS.textPrimary }}>{t('salaryPayment')}</Text>
                  <Text style={{ color: COLORS.textSecondary }}>{t('paymentMethods')}</Text>
                </div>
              </div>
              
              <div style={{ padding: '16px', backgroundColor: COLORS.backgroundSecondary, borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Text strong style={{ color: COLORS.textPrimary, fontSize: FONT_SIZES.titleSmall }}>{t('applicationMethod')}</Text>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '24px' }}>
                  <Text style={{ color: COLORS.textSecondary }}>{t('addQQ')}</Text>
                  <Text style={{ color: COLORS.textSecondary }}>{t('qqNote')}</Text>
                  <Text style={{ color: COLORS.textTertiary, fontSize: FONT_SIZES.bodySmall }}>{t('qqExample')}</Text>
                  <Text style={{ color: COLORS.success, marginTop: '8px' }}>{t('quickResponse')}</Text>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 职位卡片列表 */}
      <Row gutter={[16, 16]}>
        {/* 1. Web3 UI/UX 设计师（全职） */}
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
          <Card 
            title={t('position1Title')} 
            style={{ 
              ...CARD_STYLE, 
              marginBottom: CARD_MARGIN_BOTTOM,
              backgroundColor: COLORS.backgroundPrimary,
            }}
            headStyle={CARD_HEAD_STYLE}
            hoverable
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Text strong style={{ color: COLORS.textPrimary }}>{t('position1WhatYouDo')}</Text>
                <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', color: COLORS.textSecondary }}>
                  <li>{t('position1Content1')}</li>
                  <li>{t('position1Content2')}</li>
                  <li>{t('position1Content3')}</li>
                </ul>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Text strong style={{ color: COLORS.textPrimary }}>{t('position1Requirement')}</Text>
                <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', color: COLORS.textSecondary }}>
                  <li>{t('position1Req1')}</li>
                  <li>{t('position1Req2')}</li>
                  <li>{t('position1Req3')}</li>
                </ul>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '12px', backgroundColor: COLORS.backgroundSecondary, borderRadius: '6px' }}>
                <Text strong style={{ color: COLORS.textPrimary }}>{t('position1SalaryRange')}</Text>
                <Text style={{ color: COLORS.textSecondary }}>{t('position1Salary')}</Text>
                <Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZES.bodySmall }}>{t('position1Payment')}</Text>
              </div>
            </div>
          </Card>
        </Col>

        {/* 2. 创意美工 / 品牌视觉设计师（全职或兼职） */}
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
          <Card 
            title={t('position2Title')} 
            style={{ 
              ...CARD_STYLE, 
              marginBottom: CARD_MARGIN_BOTTOM,
              backgroundColor: COLORS.backgroundPrimary,
            }}
            headStyle={CARD_HEAD_STYLE}
            hoverable
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Text strong style={{ color: COLORS.textPrimary }}>{t('position2WhatYouDo')}</Text>
                <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', color: COLORS.textSecondary }}>
                  <li>{t('position2Content1')}</li>
                  <li>{t('position2Content2')}</li>
                  <li>{t('position2Content3')}</li>
                </ul>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Text strong style={{ color: COLORS.textPrimary }}>{t('position2Requirement')}</Text>
                <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', color: COLORS.textSecondary }}>
                  <li>{t('position2Req1')}</li>
                  <li>{t('position2Req2')}</li>
                  <li>{t('position2Req3')}</li>
                </ul>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '12px', backgroundColor: COLORS.backgroundSecondary, borderRadius: '6px' }}>
                <Text strong style={{ color: COLORS.textPrimary }}>{t('position2SalaryRange')}</Text>
                <Text style={{ color: COLORS.textSecondary }}>{t('position2Salary1')}</Text>
                <Text style={{ color: COLORS.textSecondary }}>{t('position2Salary2')}</Text>
                <Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZES.bodySmall }}>{t('position2Payment')}</Text>
              </div>
            </div>
          </Card>
        </Col>

        {/* 3. React 前端工程师（Web3 · 全职） */}
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
          <Card 
            title={t('position3Title')} 
            style={{ 
              ...CARD_STYLE, 
              marginBottom: CARD_MARGIN_BOTTOM,
              backgroundColor: COLORS.backgroundPrimary,
            }}
            headStyle={CARD_HEAD_STYLE}
            hoverable
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Text strong style={{ color: COLORS.textPrimary }}>{t('position3WhatYouDo')}</Text>
                <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', color: COLORS.textSecondary }}>
                  <li>{t('position3Content1')}</li>
                  <li>{t('position3Content2')}</li>
                  <li>{t('position3Content3')}</li>
                </ul>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Text strong style={{ color: COLORS.textPrimary }}>{t('position3Requirement')}</Text>
                <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', color: COLORS.textSecondary }}>
                  <li>{t('position3Req1')}</li>
                  <li>{t('position3Req2')}</li>
                  <li>{t('position3Req3')}</li>
                </ul>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '12px', backgroundColor: COLORS.backgroundSecondary, borderRadius: '6px' }}>
                <Text strong style={{ color: COLORS.textPrimary }}>{t('position3SalaryRange')}</Text>
                <Text style={{ color: COLORS.textSecondary }}>{t('position3Salary')}</Text>
                <Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZES.bodySmall }}>{t('position3Payment')}</Text>
              </div>
            </div>
          </Card>
        </Col>

        {/* 4. 智能合约维护工程师（兼职顾问） */}
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
          <Card 
            title={t('position4Title')} 
            style={{ 
              ...CARD_STYLE, 
              marginBottom: CARD_MARGIN_BOTTOM,
              backgroundColor: COLORS.backgroundPrimary,
            }}
            headStyle={CARD_HEAD_STYLE}
            hoverable
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Text strong style={{ color: COLORS.textPrimary }}>{t('position4WhatYouDo')}</Text>
                <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', color: COLORS.textSecondary }}>
                  <li>{t('position4Content1')}</li>
                  <li>{t('position4Content2')}</li>
                  <li>{t('position4Content3')}</li>
                </ul>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Text strong style={{ color: COLORS.textPrimary }}>{t('position4Requirement')}</Text>
                <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', color: COLORS.textSecondary }}>
                  <li>{t('position4Req1')}</li>
                  <li>{t('position4Req2')}</li>
                  <li>{t('position4Req3')}</li>
                </ul>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '12px', backgroundColor: COLORS.backgroundSecondary, borderRadius: '6px' }}>
                <Text strong style={{ color: COLORS.textPrimary }}>{t('position4SalaryRange')}</Text>
                <Text style={{ color: COLORS.textSecondary }}>{t('position4Salary')}</Text>
                <Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZES.bodySmall }}>{t('position4Payment')}</Text>
              </div>
            </div>
          </Card>
        </Col>

        {/* 5. Web3 测试专员（兼职） */}
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
          <Card 
            title={t('position5Title')} 
            style={{ 
              ...CARD_STYLE, 
              marginBottom: CARD_MARGIN_BOTTOM,
              backgroundColor: COLORS.backgroundPrimary,
            }}
            headStyle={CARD_HEAD_STYLE}
            hoverable
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Text strong style={{ color: COLORS.textPrimary }}>{t('position5WhatYouDo')}</Text>
                <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', color: COLORS.textSecondary }}>
                  <li>{t('position5Content1')}</li>
                  <li>{t('position5Content2')}</li>
                  <li>{t('position5Content3')}</li>
                </ul>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Text strong style={{ color: COLORS.textPrimary }}>{t('position5Requirement')}</Text>
                <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', color: COLORS.textSecondary }}>
                  <li>{t('position5Req1')}</li>
                  <li>{t('position5Req2')}</li>
                  <li>{t('position5Req3')}</li>
                </ul>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '12px', backgroundColor: COLORS.backgroundSecondary, borderRadius: '6px' }}>
                <Text strong style={{ color: COLORS.textPrimary }}>{t('position5SalaryRange')}</Text>
                <Text style={{ color: COLORS.textSecondary }}>{t('position5Salary')}</Text>
                <Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZES.bodySmall }}>{t('position5Payment')}</Text>
              </div>
            </div>
          </Card>
        </Col>

        {/* 6. Web3 客服专员（兼职 / 全职） */}
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
          <Card 
            title={t('position6Title')} 
            style={{ 
              ...CARD_STYLE, 
              marginBottom: CARD_MARGIN_BOTTOM,
              backgroundColor: COLORS.backgroundPrimary,
            }}
            headStyle={CARD_HEAD_STYLE}
            hoverable
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Text strong style={{ color: COLORS.textPrimary }}>{t('position6WhatYouDo')}</Text>
                <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', color: COLORS.textSecondary }}>
                  <li>{t('position6Content1')}</li>
                  <li>{t('position6Content2')}</li>
                  <li>{t('position6Content3')}</li>
                </ul>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Text strong style={{ color: COLORS.textPrimary }}>{t('position6Requirement')}</Text>
                <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', color: COLORS.textSecondary }}>
                  <li>{t('position6Req1')}</li>
                  <li>{t('position6Req2')}</li>
                  <li>{t('position6Req3')}</li>
                  <li>{t('position6Req4')}</li>
                </ul>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '12px', backgroundColor: COLORS.backgroundSecondary, borderRadius: '6px' }}>
                <Text strong style={{ color: COLORS.textPrimary }}>{t('position6SalaryRange')}</Text>
                <Text style={{ color: COLORS.textSecondary }}>{t('position6Salary1')}</Text>
                <Text style={{ color: COLORS.textSecondary }}>{t('position6Salary2')}</Text>
                <Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZES.bodySmall }}>{t('position6Payment')}</Text>
              </div>
            </div>
          </Card>
        </Col>

        {/* 7. 外宣 / 社群运营专员（全职或强兼职） */}
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
          <Card 
            title={t('position7Title')} 
            style={{ 
              ...CARD_STYLE, 
              marginBottom: CARD_MARGIN_BOTTOM,
              backgroundColor: COLORS.backgroundPrimary,
            }}
            headStyle={CARD_HEAD_STYLE}
            hoverable
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Text strong style={{ color: COLORS.textPrimary }}>{t('position7WhatYouDo')}</Text>
                <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', color: COLORS.textSecondary }}>
                  <li>{t('position7Content1')}</li>
                  <li>{t('position7Content2')}</li>
                  <li>{t('position7Content3')}</li>
                  <li>{t('position7Content4')}</li>
                  <li>{t('position7Content5')}</li>
                </ul>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Text strong style={{ color: COLORS.textPrimary }}>{t('position7Requirement')}</Text>
                <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', color: COLORS.textSecondary }}>
                  <li>{t('position7Req1')}</li>
                  <li>{t('position7Req2')}</li>
                  <li>{t('position7Req3')}</li>
                  <li>{t('position7Req4')}</li>
                </ul>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '12px', backgroundColor: COLORS.backgroundSecondary, borderRadius: '6px' }}>
                <Text strong style={{ color: COLORS.textPrimary }}>{t('position7SalaryRange')}</Text>
                <Text style={{ color: COLORS.textSecondary }}>{t('position7Salary1')}</Text>
                <Text style={{ color: COLORS.textSecondary }}>{t('position7Salary2')}</Text>
                <Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZES.bodySmall }}>{t('position7Payment')}</Text>
              </div>
            </div>
          </Card>
        </Col>

        {/* 8. Web3 主持讲师 / 项目布道师（兼职或全职） */}
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
          <Card 
            title={t('position8Title')} 
            style={{ 
              ...CARD_STYLE, 
              marginBottom: CARD_MARGIN_BOTTOM,
              backgroundColor: COLORS.backgroundPrimary,
            }}
            headStyle={CARD_HEAD_STYLE}
            hoverable
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Text strong style={{ color: COLORS.textPrimary }}>{t('position8WhatYouDo')}</Text>
                <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', color: COLORS.textSecondary }}>
                  <li>{t('position8Content1')}</li>
                  <li>{t('position8Content2')}</li>
                  <li>{t('position8Content3')}</li>
                  <li>{t('position8Content4')}</li>
                </ul>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Text strong style={{ color: COLORS.textPrimary }}>{t('position8Requirement')}</Text>
                <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', color: COLORS.textSecondary }}>
                  <li>{t('position8Req1')}</li>
                  <li>{t('position8Req2')}</li>
                  <li>{t('position8Req3')}</li>
                  <li>{t('position8Req4')}</li>
                  <li>{t('position8Req5')}</li>
                  <li>{t('position8Req6')}</li>
                </ul>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '12px', backgroundColor: COLORS.backgroundSecondary, borderRadius: '6px' }}>
                <Text strong style={{ color: COLORS.textPrimary }}>{t('position8SalaryRange')}</Text>
                <Text style={{ color: COLORS.textSecondary }}>{t('position8Salary1')}</Text>
                <Text style={{ color: COLORS.textSecondary }}>{t('position8Salary2')}</Text>
                <Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZES.bodySmall }}>{t('position8Payment')}</Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CommunityPage;