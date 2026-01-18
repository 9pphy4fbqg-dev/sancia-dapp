import React, { createContext, useState, useContext, ReactNode } from 'react';

// 定义语言类型
export type Language = 'zh' | 'en';

// 定义翻译内容类型
export interface TranslationContent {
  [key: string]: {
    zh: string;
    en: string;
  };
}

// 翻译内容
export const translations: TranslationContent = {
  // 导航菜单
  nav: {
    zh: '导航',
    en: 'Navigation'
  },
  buy: {
    zh: '私募',
    en: 'Private Sale'
  },
  data: {
    zh: '数据',
    en: 'Data'
  },
  community: {
    zh: '社区',
    en: 'Community'
  },
  mall: {
    zh: '商城',
    en: 'Mall'
  },
  nft: {
    zh: 'NFT',
    en: 'NFT'
  },
  me: {
    zh: '我',
    en: 'Profile'
  },
  
  // 扫描二维码
  scanQR: {
    zh: '扫描二维码',
    en: 'Scan QR Code'
  },
  initializingCamera: {
    zh: '正在初始化摄像头...',
    en: 'Initializing camera...'
  },
  allowCameraAccess: {
    zh: '请允许浏览器访问您的摄像头',
    en: 'Please allow browser to access your camera'
  },
  cannotAccessCamera: {
    zh: '无法访问摄像头，请检查权限设置',
    en: 'Cannot access camera, please check permission settings'
  },
  scanningQR: {
    zh: '正在扫描二维码，请将二维码对准扫描框',
    en: 'Scanning QR code, please aim at the scanning frame'
  },
  manualInput: {
    zh: '手动输入推荐人地址',
    en: 'Manually input referral address'
  },
  scanSuccessReferrer: {
    zh: '扫描成功，推荐人地址：{{ref}}',
    en: 'Scan successful, referral address: {{ref}}'
  },
  scanResult: {
    zh: '扫描结果：{{result}}',
    en: 'Scan result: {{result}}'
  },
  
  // 社区页面
  communityFunction: {
    zh: '社区功能',
    en: 'Community Features'
  },
  underDevelopment: {
    zh: '功能正在开发中',
    en: 'Features are under development'
  },
  comingSoon: {
    zh: '我们正在积极开发社区功能，敬请期待！',
    en: 'We are actively developing community features, stay tuned!'
  },
  recruitment: {
    zh: '【数字珠宝 × 区块链】项目远程招聘',
    en: '[Digital Jewelry × Blockchain] Project Remote Recruitment'
  },
  smartContractDeployed: {
    zh: '智能合约已部署',
    en: 'Smart Contract Deployed'
  },
  dappV1Launched: {
    zh: 'DApp V1 已上线',
    en: 'DApp V1 Launched'
  },
  workStyle: {
    zh: '工作方式：',
    en: 'Work Style: '
  },
  remoteWork: {
    zh: '全国远程 · 时间自由 · 异步协作',
    en: 'Remote nationwide · Flexible time · Asynchronous collaboration'
  },
  salaryPayment: {
    zh: '薪酬支付：',
    en: 'Salary Payment: '
  },
  paymentMethods: {
    zh: '支持 USDT（TRC20/ERC20） 或 项目代币 （比例可协商，代币带锁仓机制）',
    en: 'Support USDT (TRC20/ERC20) or project tokens (ratio negotiable, tokens with lock-up mechanism)'
  },
  applicationMethod: {
    zh: '📩 统一申请方式：',
    en: '📩 Unified Application Method: '
  },
  addQQ: {
    zh: '添加项目组 QQ → 909344344',
    en: 'Add project group QQ → 909344344'
  },
  qqNote: {
    zh: '添加时务必备注：【岗位名称 + 姓名】',
    en: 'Please note when adding: [Position Name + Name]'
  },
  qqExample: {
    zh: '（例如：【主持讲师 王芳】、【外宣专员 李雷】）',
    en: '(e.g., [Host Lecturer Wang Fang], [Publicity Specialist Li Lei])'
  },
  quickResponse: {
    zh: '⏱️ 通过后将快速安排沟通，高效推进！',
    en: '⏱️ Communication will be arranged quickly after passing, efficient progress!'
  },
  // 职位相关翻译
  position1Title: {
    zh: 'Web3 UI/UX 设计师（全职）',
    en: 'Web3 UI/UX Designer (Full-time)'
  },
  position1WhatYouDo: {
    zh: '你要做的事',
    en: 'What You Will Do'
  },
  position1Requirement: {
    zh: '我们希望你',
    en: 'We Hope You'
  },
  position1SalaryRange: {
    zh: '薪资范围：',
    en: 'Salary Range: '
  },
  // 职位2相关翻译
  position2WhatYouDo: {
    zh: '你要做的事',
    en: 'What You Will Do'
  },
  position2Requirement: {
    zh: '我们希望你',
    en: 'We Hope You'
  },
  position2SalaryRange: {
    zh: '薪资范围：',
    en: 'Salary Range: '
  },
  // 职位3相关翻译
  position3WhatYouDo: {
    zh: '你要做的事',
    en: 'What You Will Do'
  },
  position3Requirement: {
    zh: '我们希望你',
    en: 'We Hope You'
  },
  position3SalaryRange: {
    zh: '薪资范围：',
    en: 'Salary Range: '
  },
  // 职位4相关翻译
  position4WhatYouDo: {
    zh: '你要做的事',
    en: 'What You Will Do'
  },
  position4Requirement: {
    zh: '我们希望你',
    en: 'We Hope You'
  },
  position4SalaryRange: {
    zh: '薪资范围：',
    en: 'Salary Range: '
  },
  // 职位5相关翻译
  position5WhatYouDo: {
    zh: '你要做的事',
    en: 'What You Will Do'
  },
  position5Requirement: {
    zh: '我们希望你',
    en: 'We Hope You'
  },
  position5SalaryRange: {
    zh: '薪资范围：',
    en: 'Salary Range: '
  },
  // 职位6相关翻译
  position6WhatYouDo: {
    zh: '你要做的事',
    en: 'What You Will Do'
  },
  position6Requirement: {
    zh: '我们希望你',
    en: 'We Hope You'
  },
  position6SalaryRange: {
    zh: '薪资范围：',
    en: 'Salary Range: '
  },
  // 职位7相关翻译
  position7WhatYouDo: {
    zh: '你要做的事',
    en: 'What You Will Do'
  },
  position7Requirement: {
    zh: '我们希望你',
    en: 'We Hope You'
  },
  position7SalaryRange: {
    zh: '薪资范围：',
    en: 'Salary Range: '
  },
  // 职位8相关翻译
  position8WhatYouDo: {
    zh: '你要做的事',
    en: 'What You Will Do'
  },
  position8Requirement: {
    zh: '我们希望你',
    en: 'We Hope You'
  },
  position8SalaryRange: {
    zh: '薪资范围：',
    en: 'Salary Range: '
  },
  position1Content1: {
    zh: '优化 DApp 核心流程：钱包连接、NFT 铸造、交易、展示',
    en: 'Optimize DApp core processes: wallet connection, NFT minting, transactions, display'
  },
  position1Content2: {
    zh: '重新设计珠宝 NFT 界面，兼顾 奢华感 + 科技感 + 易用性',
    en: 'Redesign jewelry NFT interface, balancing luxury + technology + usability'
  },
  position1Content3: {
    zh: '输出高保真 Figma 原型，与开发高效协作',
    en: 'Output high-fidelity Figma prototypes, collaborate efficiently with development'
  },
  position1Req1: {
    zh: '有 NFT/DApp 产品设计经验（必须！）',
    en: 'Have NFT/DApp product design experience (must!)'
  },
  position1Req2: {
    zh: '熟练使用 Figma，理解 Web3 用户操作痛点',
    en: 'Proficient in Figma, understand Web3 user operation pain points'
  },
  position1Req3: {
    zh: '对珠宝、奢侈品、艺术类视觉有审美判断力',
    en: 'Have aesthetic judgment on jewelry, luxury goods, and art visuals'
  },
  position1Salary: {
    zh: '18K – 32K RMB/月',
    en: '18K – 32K RMB/month'
  },
  position1Payment: {
    zh: '支付方式：70% USDT + 30% 项目代币（6个月锁仓，12个月线性释放）',
    en: 'Payment Method: 70% USDT + 30% project tokens (6-month lock-up, 12-month linear release)'
  },
  // 职位2：创意美工 / 品牌视觉设计师（全职或兼职）
  position2Title: {
    zh: '创意美工 / 品牌视觉设计师（全职或兼职）',
    en: 'Creative Artist / Brand Visual Designer (Full-time or Part-time)'
  },
  position2Content1: {
    zh: '设计社交媒体素材（小红书、微博、微信、抖音等）',
    en: 'Design social media materials (Xiaohongshu, Weibo, WeChat, Douyin, etc.)'
  },
  position2Content2: {
    zh: '制作 NFT 发售海报、白皮书插图、官网 Banner',
    en: 'Create NFT launch posters, whitepaper illustrations, official website banners'
  },
  position2Content3: {
    zh: '建立品牌视觉规范，输出高端数字珠宝形象',
    en: 'Establish brand visual guidelines, output high-end digital jewelry image'
  },
  position2Req1: {
    zh: '有 Web3/NFT/潮牌/奢侈品相关作品',
    en: 'Have Web3/NFT/streetwear/luxury related works'
  },
  position2Req2: {
    zh: '精通 PS/AI/AE，能出静态+动态素材',
    en: 'Proficient in PS/AI/AE, can produce static+dynamic materials'
  },
  position2Req3: {
    zh: '审美好，拒绝“土味设计”',
    en: 'Good aesthetics, reject "tacky design"'
  },
  position2Salary1: {
    zh: '全职：12K – 25K RMB/月',
    en: 'Full-time: 12K – 25K RMB/month'
  },
  position2Salary2: {
    zh: '兼职：按项目结算（单图 500–2000 元起）',
    en: 'Part-time: Project-based settlement (from 500–2000 yuan per image)'
  },
  position2Payment: {
    zh: '支持 USDT 或代币支付',
    en: 'Support USDT or token payment'
  },
  // 职位3：React 前端工程师（Web3 · 全职）
  position3Title: {
    zh: 'React 前端工程师（Web3 · 全职）',
    en: 'React Frontend Engineer (Web3 · Full-time)'
  },
  position3Content1: {
    zh: '维护和迭代 DApp 前端（React + TypeScript）',
    en: 'Maintain and iterate DApp frontend (React + TypeScript)'
  },
  position3Content2: {
    zh: '集成钱包（MetaMask/TP/OKX 等）与智能合约交互',
    en: 'Integrate wallets (MetaMask/TP/OKX, etc.) and interact with smart contracts'
  },
  position3Content3: {
    zh: '开发新功能：质押、合成珠宝、二级市场等',
    en: 'Develop new features: staking, synthetic jewelry, secondary market, etc.'
  },
  position3Req1: {
    zh: '有 DApp 上线项目经验（必须！）',
    en: 'Have DApp launch project experience (must!)'
  },
  position3Req2: {
    zh: '熟悉 wagmi/viem + RainbowKit',
    en: 'Familiar with wagmi/viem + RainbowKit'
  },
  position3Req3: {
    zh: '能独立联调合约，注重代码质量与性能',
    en: 'Can independently integrate with contracts, focus on code quality and performance'
  },
  position3Salary: {
    zh: '25K – 45K RMB/月',
    en: '25K – 45K RMB/month'
  },
  position3Payment: {
    zh: '支付方式：70% USDT + 30% 项目代币',
    en: 'Payment Method: 70% USDT + 30% project tokens'
  },
  // 职位4：智能合约维护工程师（兼职顾问）
  position4Title: {
    zh: '智能合约维护工程师（兼职顾问）',
    en: 'Smart Contract Maintenance Engineer (Part-time Consultant)'
  },
  position4Content1: {
    zh: '协助合约升级（Proxy 模式）',
    en: 'Assist with contract upgrades (Proxy mode)'
  },
  position4Content2: {
    zh: '编写测试用例（Hardhat/Foundry）',
    en: 'Write test cases (Hardhat/Foundry)'
  },
  position4Content3: {
    zh: '配合审计，修复漏洞，处理紧急问题',
    en: 'Cooperate with audits, fix vulnerabilities, handle emergency issues'
  },
  position4Req1: {
    zh: '精通 Solidity，熟悉 ERC-721/1155',
    en: 'Proficient in Solidity, familiar with ERC-721/1155'
  },
  position4Req2: {
    zh: '有主网部署和升级经验',
    en: 'Have mainnet deployment and upgrade experience'
  },
  position4Req3: {
    zh: '每月可投入 10–20 小时',
    en: 'Available 10–20 hours per month'
  },
  position4Salary: {
    zh: '20K – 35K RMB/月（按月 retain）',
    en: '20K – 35K RMB/month (monthly retainer)'
  },
  position4Payment: {
    zh: '支持 USDT 或代币支付',
    en: 'Support USDT or token payment'
  },
  // 职位5：Web3 测试专员（兼职）
  position5Title: {
    zh: 'Web3 测试专员（兼职）',
    en: 'Web3 Test Specialist (Part-time)'
  },
  position5Content1: {
    zh: '在多钱包环境测试 DApp 功能（MetaMask/TP/OKX 等）',
    en: 'Test DApp functions in multi-wallet environments (MetaMask/TP/OKX, etc.)'
  },
  position5Content2: {
    zh: '验证核心流程：铸造、转账、交易',
    en: 'Verify core processes: minting, transfers, transactions'
  },
  position5Content3: {
    zh: '提交清晰 Bug 报告（含截图+操作步骤）',
    en: 'Submit clear bug reports (with screenshots + operation steps)'
  },
  position5Req1: {
    zh: '会用主流钱包，了解 Web3 基础操作',
    en: 'Can use mainstream wallets, understand Web3 basic operations'
  },
  position5Req2: {
    zh: '细心、耐心，有测试经验加分',
    en: 'Careful, patient, testing experience is a plus'
  },
  position5Req3: {
    zh: '每周可投入 10 小时以上',
    en: 'Available more than 10 hours per week'
  },
  position5Salary: {
    zh: '5K – 10K RMB/月（按任务量）',
    en: '5K – 10K RMB/month (task-based)'
  },
  position5Payment: {
    zh: 'USDT 结算，支持周结/半月结',
    en: 'USDT settlement, support weekly/biweekly payment'
  },
  // 职位6：Web3 客服专员（兼职 / 全职）
  position6Title: {
    zh: 'Web3 客服专员（兼职 / 全职）',
    en: 'Web3 Customer Service Specialist (Part-time / Full-time)'
  },
  position6Content1: {
    zh: '在 QQ / 微信 / Telegram 解答用户问题（如：如何连接钱包、交易失败怎么办）',
    en: 'Answer user questions on QQ / WeChat / Telegram (e.g., how to connect wallet, what to do if transaction fails)'
  },
  position6Content2: {
    zh: '收集反馈，整理常见问题（FAQ）',
    en: 'Collect feedback, organize FAQ'
  },
  position6Content3: {
    zh: '协助引导新用户完成首次操作，提升留存',
    en: 'Help guide new users to complete first operation, improve retention'
  },
  position6Req1: {
    zh: '熟悉 MetaMask、TP 钱包、OKX Wallet 等',
    en: 'Familiar with MetaMask, TP Wallet, OKX Wallet, etc.'
  },
  position6Req2: {
    zh: '了解 Gas、链上交易、NFT 等基础概念',
    en: 'Understand basic concepts of Gas, on-chain transactions, NFT, etc.'
  },
  position6Req3: {
    zh: '沟通耐心，服务意识强',
    en: 'Patient communication, strong service awareness'
  },
  position6Req4: {
    zh: '每天可在线 3 小时以上（全职需 6 小时+）',
    en: 'Available online more than 3 hours per day (full-time requires 6+ hours)'
  },
  position6Salary1: {
    zh: '兼职：3K – 6K RMB/月',
    en: 'Part-time: 3K – 6K RMB/month'
  },
  position6Salary2: {
    zh: '全职：6K – 9K RMB/月',
    en: 'Full-time: 6K – 9K RMB/month'
  },
  position6Payment: {
    zh: '支付方式：100% USDT（可周结）',
    en: 'Payment Method: 100% USDT (weekly payment available)'
  },
  // 职位7：外宣 / 社群运营专员（全职或强兼职）
  position7Title: {
    zh: '外宣 / 社群运营专员（全职或强兼职）',
    en: 'Publicity / Community Operations Specialist (Full-time or Strong Part-time)'
  },
  position7Content1: {
    zh: '运营官方社群（QQ 群、微信群、Telegram）',
    en: 'Operate official communities (QQ group, WeChat group, Telegram)'
  },
  position7Content2: {
    zh: '在小红书、微博、抖音、公众号等平台发布内容',
    en: 'Publish content on Xiaohongshu, Weibo, Douyin, official accounts, etc.'
  },
  position7Content3: {
    zh: '策划空投、NFT 发售、AMA 等活动',
    en: 'Plan airdrops, NFT launches, AMA, etc.'
  },
  position7Content4: {
    zh: '对接 KOL/KOC，扩大项目声量',
    en: 'Connect with KOL/KOC, expand project influence'
  },
  position7Content5: {
    zh: '监测竞品，提出传播优化建议',
    en: 'Monitor competitors, propose communication optimization suggestions'
  },
  position7Req1: {
    zh: '有 Web3/NFT/数字藏品项目运营经验（必须！）',
    en: 'Have Web3/NFT/digital collectibles project operation experience (must!)'
  },
  position7Req2: {
    zh: '能独立产出图文/短视频内容',
    en: 'Can independently produce graphic/short video content'
  },
  position7Req3: {
    zh: '有社群管理或 KOL 资源加分',
    en: 'Community management or KOL resources are a plus'
  },
  position7Req4: {
    zh: '网感强，执行力高，能扛节奏',
    en: 'Strong internet sense, high execution, can handle rhythm'
  },
  position7Salary1: {
    zh: '全职：8K – 15K RMB/月',
    en: 'Full-time: 8K – 15K RMB/month'
  },
  position7Salary2: {
    zh: '强兼职（每周 ≥20 小时）：5K – 10K RMB/月',
    en: 'Strong part-time (≥20 hours per week): 5K – 10K RMB/month'
  },
  position7Payment: {
    zh: '支付方式：70% USDT + 30% 项目代币（6个月锁仓）',
    en: 'Payment Method: 70% USDT + 30% project tokens (6-month lock-up)'
  },
  // 职位8：Web3 主持讲师 / 项目布道师（兼职或全职）
  position8Title: {
    zh: 'Web3 主持讲师 / 项目布道师（兼职或全职）',
    en: 'Web3 Host Lecturer / Project Evangelist (Part-time or Full-time)'
  },
  position8Content1: {
    zh: '主持线上 AMA、NFT 发售发布会、社区直播等活动',
    en: 'Host online AMA, NFT launch conferences, community live broadcasts, etc.'
  },
  position8Content2: {
    zh: '向用户清晰讲解：珠宝上链价值、合约安全性、DApp 使用、代币模型 等',
    en: 'Clearly explain to users: jewelry on-chain value, contract security, DApp usage, token model, etc.'
  },
  position8Content3: {
    zh: '在合作平台（数藏社群、Web3 沙龙等）代表项目宣讲',
    en: 'Represent the project to speak at cooperative platforms (digital collection communities, Web3 salons, etc.)'
  },
  position8Content4: {
    zh: '协助制作科普短视频脚本或口播内容',
    en: 'Assist in producing popular science short video scripts or voiceover content'
  },
  position8Req1: {
    zh: '有 直播/主持/演讲经验 （培训师、电台、MC、知识博主等）',
    en: 'Have live broadcast/host/speaking experience (trainer, radio, MC, knowledge blogger, etc.)'
  },
  position8Req2: {
    zh: '深度理解 Web3/NFT 原理，能用通俗语言讲清技术',
    en: 'Deeply understand Web3/NFT principles, can explain technology in plain language'
  },
  position8Req3: {
    zh: '对 珠宝、奢侈品、收藏品 有浓厚兴趣或背景',
    en: 'Strong interest or background in jewelry, luxury goods, collectibles'
  },
  position8Req4: {
    zh: '表达流畅，有亲和力与控场能力',
    en: 'Fluent expression, has affinity and control ability'
  },
  position8Req5: {
    zh: '能配合晚间/周末活动时间',
    en: 'Can cooperate with evening/weekend activity time'
  },
  position8Req6: {
    zh: '加分项：有出镜视频、Web3 AMA 主持经验、NFT 收藏经历',
    en: 'Bonus: have appearance videos, Web3 AMA hosting experience, NFT collection experience'
  },
  position8Salary1: {
    zh: '兼职（按场次）：800 – 3000 元/场',
    en: 'Part-time (per event): 800 – 3000 yuan/event'
  },
  position8Salary2: {
    zh: '全职（含内容+主持+运营）：10K – 20K RMB/月',
    en: 'Full-time (including content+hosting+operation): 10K – 20K RMB/month'
  },
  position8Payment: {
    zh: '支持 USDT 或代币支付',
    en: 'Support USDT or token payment'
  },
  
  // 私募页面
  privateSale: {
    zh: '私募',
    en: 'Private Sale'
  },
  buySCIA: {
    zh: '购买SCIA',
    en: 'Buy SCIA'
  },
  price: {
    zh: '价格',
    en: 'Price'
  },
  perPackage: {
    zh: '每包数量',
    en: 'Per Package'
  },
  minimumPurchase: {
    zh: '最小购买',
    en: 'Minimum Purchase'
  },
  maximumPurchase: {
    zh: '最大购买',
    en: 'Maximum Purchase'
  },
  estimatedAmount: {
    zh: '预估金额',
    en: 'Estimated Amount'
  },
  estimatedSCIA: {
    zh: '预估代币数量',
    en: 'Estimated SCIA'
  },
  
  // 个人中心
  profile: {
    zh: '个人中心',
    en: 'Profile'
  },
  basicInfo: {
    zh: '基本信息',
    en: 'Basic Info'
  },
  walletAddress: {
    zh: '钱包地址',
    en: 'Wallet Address'
  },
  promotionLink: {
    zh: '推广链接',
    en: 'Promotion Link'
  },
  notConnected: {
    zh: '未连接',
    en: 'Not Connected'
  },
  referrer: {
    zh: '推荐人',
    en: 'Referrer'
  },
  badgeLevel: {
    zh: '徽章等级',
    en: 'Badge Level'
  },
  currentBadge: {
    zh: '当前徽章',
    en: 'Current Badge'
  },
  upgradeProgress: {
    zh: '升级进度',
    en: 'Upgrade Progress'
  },
  pointsNeeded: {
    zh: '还需 {{points}} 积分',
    en: '{{points}} points needed'
  },
  pointsBalance: {
    zh: '积分与余额',
    en: 'Points & Balance'
  },
  totalPoints: {
    zh: '总积分',
    en: 'Total Points'
  },
  usdtBalance: {
    zh: 'USDT余额',
    en: 'USDT Balance'
  },
  usdtAllowance: {
    zh: 'USDT授权',
    en: 'USDT Allowance'
  },
  sciaBalance: {
    zh: 'SCIA余额',
    en: 'SCIA Balance'
  },
  dividendClaim: {
    zh: '分红领取',
    en: 'Dividend Claim'
  },
  claimableDividend: {
    zh: '可领取分红',
    en: 'Claimable Dividend'
  },
  claimDividend: {
    zh: '领取{{badge}}分红',
    en: 'Claim {{badge}} Dividend'
  },
  noDividendPermission: {
    zh: '暂无分红权限',
    en: 'No Dividend Permission'
  },
  promotionInfo: {
    zh: '推广信息',
    en: 'Promotion Info'
  },
  promotionLinkQR: {
    zh: '推广链接与二维码',
    en: 'Promotion Link & QR Code'
  },
  downloadQR: {
    zh: '下载二维码',
    en: 'Download QR Code'
  },
  usageInstructions: {
    zh: '使用说明',
    en: 'Usage Instructions'
  },
  promotionSteps: {
    zh: '通过推广链接或二维码邀请好友购买SCIA代币',
    en: 'Invite friends to buy SCIA tokens via promotion link or QR code'
  },
  referralReward: {
    zh: '好友购买成功后，您将获得5% USDT和5% SCIA的推荐奖励',
    en: 'After your friend successfully purchases, you will receive 5% USDT and 5% SCIA referral reward'
  },
  autoCalculation: {
    zh: '推荐奖励自动计算并累积',
    en: 'Referral rewards are automatically calculated and accumulated'
  },
  viewReferralTree: {
    zh: '推广记录可在推荐树中查看',
    en: 'Promotion records can be viewed in the referral tree'
  },
  directReferrals: {
    zh: '直接推荐记录',
    en: 'Direct Referral Records'
  },
  noReferrals: {
    zh: '暂无推荐记录',
    en: 'No referral records yet'
  },
  viewAllReferrals: {
    zh: '查询所有推荐树（包含推荐统计）',
    en: 'View All Referral Tree (including referral statistics)'
  },
  noPromotionPermission: {
    zh: '暂无推广权限',
    en: 'No Promotion Permission'
  },
  buyToGetLink: {
    zh: '根据合约规则，您需要先购买SCIA代币才能获取专属推广链接和二维码',
    en: 'According to contract rules, you need to purchase SCIA tokens first to get exclusive promotion link and QR code'
  },
  buyNow: {
    zh: '立即购买',
    en: 'Buy Now'
  },
  
  // 推荐树
  referralTree: {
    zh: '推荐树',
    en: 'Referral Tree'
  },
  loadingReferralTree: {
    zh: '正在加载推荐树...',
    en: 'Loading referral tree...'
  },
  referralStatistics: {
    zh: '推荐统计',
    en: 'Referral Statistics'
  },
  directReferralCount: {
    zh: '直接推荐人数',
    en: 'Direct Referral Count'
  },
  totalReferralCount: {
    zh: '总推荐人数',
    en: 'Total Referral Count'
  },
  totalUSDReward: {
    zh: '总USDT奖励',
    en: 'Total USDT Reward'
  },
  totalSCIAReward: {
    zh: '总SCIA奖励',
    en: 'Total SCIA Reward'
  },
  referralPurchaseDetails: {
    zh: '被推荐人购买明细',
    en: 'Referral Purchase Details'
  },
  
  // 通用
  noData: {
    zh: '暂无数据',
    en: 'No Data'
  },
  loading: {
    zh: '加载中...',
    en: 'Loading...'
  },
  connectWallet: {
    zh: '请先连接钱包',
    en: 'Please connect wallet first'
  },
  copy: {
    zh: '复制',
    en: 'Copy'
  },
  copySuccess: {
    zh: '复制成功！',
    en: 'Copied successfully!'
  },
  copyFailed: {
    zh: '复制失败，请手动复制',
    en: 'Copy failed, please copy manually'
  },
  
  // 操作提示
  pleaseConnectWalletFirst: {
    zh: '请先连接钱包',
    en: 'Please connect wallet first'
  },
  operationFailedTryAgain: {
    zh: '操作失败，请稍后重试',
    en: 'Operation failed, please try again later'
  },
  privateSalePausedTryAgainLater: {
    zh: '私募销售已暂停，请稍后重试',
    en: 'Private sale is paused, please try again later'
  },
  privateSaleEndedCannotBuy: {
    zh: '私募销售已结束，无法继续购买',
    en: 'Private sale has ended, cannot buy anymore'
  },
  
  // 私募页面表单
  enterPackages: {
    zh: '请输入购买数量',
    en: 'Please enter the number of packages'
  },
  packagesRange: {
    zh: '购买数量必须在1到1000之间',
    en: 'Number of packages must be between 1 and 1000'
  },
  referrerAddressOptional: {
    zh: '推荐人地址（可选）',
    en: 'Referrer Address (Optional)'
  },
  enterReferrerAddress: {
    zh: '输入推荐人钱包地址',
    en: 'Enter referrer wallet address'
  },
  connectWalletToBuy: {
    zh: '请连接钱包以购买',
    en: 'Connect Wallet to Buy'
  },
  salePaused: {
    zh: '销售已暂停',
    en: 'Sale Paused'
  },
  saleOngoing: {
    zh: '销售进行中',
    en: 'Sale Ongoing'
  },
  saleEnded: {
    zh: '销售已结束',
    en: 'Sale Ended'
  },
  submittingPurchaseRequest: {
    zh: '正在提交购买请求...',
    en: 'Submitting purchase request...'
  },
  purchaseRequestSubmitted: {
    zh: '购买请求已提交，交易哈希：',
    en: 'Purchase request submitted, transaction hash: '
  },
  // 错误信息
  purchaseFailedTryAgain: {
    zh: '购买失败，请稍后重试',
    en: 'Purchase failed, please try again later'
  },
  userRejectedTransaction: {
    zh: '用户拒绝了交易',
    en: 'User rejected the transaction'
  },
  networkOrNodeErrorTryAgain: {
    zh: '网络或节点错误，请重试',
    en: 'Network or node error, please try again'
  },
  insufficientUSDTBalance: {
    zh: 'USDT余额不足',
    en: 'Insufficient USDT balance'
  },
  transactionRejectedByContract: {
    zh: '交易被合约拒绝，请检查输入参数',
    en: 'Transaction rejected by contract, please check input parameters'
  },
  walletClientNotConnected: {
    zh: '钱包客户端未连接，请检查连接状态',
    en: 'Wallet client not connected, please check connection status'
  },
  purchaseSuccess: {
    zh: '购买成功！交易已确认',
    en: 'Purchase successful! Transaction confirmed'
  },
  purchaseFailed: {
    zh: '购买失败',
    en: 'Purchase Failed'
  },
  unknownError: {
    zh: '未知错误',
    en: 'Unknown Error'
  },
  transactionHash: {
    zh: '交易哈希',
    en: 'Transaction Hash'
  },
  usdtApprovalSuccess: {
    zh: 'USDT授权成功！',
    en: 'USDT approval successful!'
  },
  usdtApprovalSuccessPreparingPurchase: {
    zh: 'USDT授权成功，正在准备购买...',
    en: 'USDT approval successful, preparing purchase...'
  },
  usdtApprovalFailed: {
    zh: 'USDT授权失败',
    en: 'USDT approval failed'
  },
  operationInProgress: {
    zh: '操作正在进行中，请稍候...',
    en: 'Operation in progress, please wait...'
  },
  checkingBalanceAndAllowance: {
    zh: '正在检查余额和授权...',
    en: 'Checking balance and allowance...'
  },
  insufficientUSDTAllowanceRequesting: {
    zh: 'USDT授权不足，正在请求授权...',
    en: 'Insufficient USDT allowance, requesting approval...'
  },
  usdtApprovalRequestSubmitted: {
    zh: 'USDT授权请求已提交，正在等待区块链确认...',
    en: 'USDT approval request submitted, waiting for blockchain confirmation...'
  },
  usdtApproving: {
    zh: 'USDT授权中...',
    en: 'USDT Approving...'
  },
  buying: {
    zh: '购买中...',
    en: 'Buying...'
  },
  approvalTransactionHash: {
    zh: '授权交易哈希',
    en: 'Approval Transaction Hash'
  },
  purchaseTransactionHash: {
    zh: '购买交易哈希',
    en: 'Purchase Transaction Hash'
  },
  insufficientBalance: {
    zh: '余额不足',
    en: 'Insufficient Balance'
  },
  insufficientAllowance: {
    zh: '授权不足',
    en: 'Insufficient Allowance'
  },
  
  // 数据页面
  desktop: {
    zh: '桌面端',
    en: 'Desktop'
  },
  mobile: {
    zh: '移动端',
    en: 'Mobile'
  },
  tablet: {
    zh: '平板端',
    en: 'Tablet'
  },
  unknown: {
    zh: '未知',
    en: 'Unknown'
  },
  viewportSize: {
    zh: '视口尺寸',
    en: 'Viewport Size'
  },
  deviceType: {
    zh: '设备类型',
    en: 'Device Type'
  },
  responsiveDesign: {
    zh: '响应式适配',
    en: 'Responsive Design'
  },
  featureIntegrity: {
    zh: '功能完整性',
    en: 'Feature Integrity'
  },
  blockchainData: {
    zh: '链上数据',
    en: 'Blockchain Data'
  },
  dataIntegrity: {
    zh: '数据完整性',
    en: 'Data Integrity'
  },
  threeEndConsistency: {
    zh: '三端一致性验证',
    en: 'Three-End Consistency Verification'
  },
  overallConsistency: {
    zh: '三端一致性',
    en: 'Overall Consistency'
  },
  privatePoolInfo: {
    zh: '私募池信息',
    en: 'Private Pool Info'
  },
  remainingPrivateSale: {
    zh: '剩余私募池代币',
    en: 'Remaining Private Sale'
  },
  remainingReward: {
    zh: '剩余奖励池代币',
    en: 'Remaining Reward Pool'
  },
  currentPrivatePool: {
    zh: '当前私募池余额',
    en: 'Current Private Pool'
  },
  currentRewardPool: {
    zh: '当前奖励池余额',
    en: 'Current Reward Pool'
  },
  totalSold: {
    zh: '总售出代币',
    en: 'Total Sold Tokens'
  },
  totalRewards: {
    zh: '总分发奖励',
    en: 'Total Distributed Rewards'
  },
  contractAddresses: {
    zh: '合约地址',
    en: 'Contract Addresses'
  },
  privateSaleContract: {
    zh: '私募合约',
    en: 'Private Sale Contract'
  },
  referralCenterContract: {
    zh: '推荐中心合约',
    en: 'Referral Center Contract'
  },
  contractStatus: {
    zh: '合约状态验证',
    en: 'Contract Status Verification'
  },
  saleStatus: {
    zh: '销售状态',
    en: 'Sale Status'
  },
  ongoing: {
    zh: '进行中',
    en: 'Ongoing'
  },
  paused: {
    zh: '已暂停',
    en: 'Paused'
  },
  ended: {
    zh: '已结束',
    en: 'Ended'
  },
  badgeVerification: {
    zh: '徽章信息验证',
    en: 'Badge Information Verification'
  },
  currentPoints: {
    zh: '当前积分',
    en: 'Current Points'
  },
  nationalThreshold: {
    zh: '国家级阈值',
    en: 'National Threshold'
  },
  detailedVerification: {
    zh: '详细验证结果',
    en: 'Detailed Verification Results'
  },
  usdtBalanceConsistency: {
    zh: 'USDT余额一致性',
    en: 'USDT Balance Consistency'
  },
  sciaBalanceConsistency: {
    zh: 'SCIA余额一致性',
    en: 'SCIA Balance Consistency'
  },
  badgeConsistency: {
    zh: '徽章一致性',
    en: 'Badge Consistency'
  },
  pointsConsistency: {
    zh: '积分一致性',
    en: 'Points Consistency'
  },
  referrerConsistency: {
    zh: '推荐人一致性',
    en: 'Referrer Consistency'
  },
  verificationMetrics: {
    zh: '验证指标',
    en: 'Verification Metrics'
  },
  verificationInfo: {
    zh: '验证信息',
    en: 'Verification Info'
  },
  verificationFrequency: {
    zh: '验证频率：30秒/次',
    en: 'Verification Frequency: 30s/Time'
  },
  lastVerified: {
    zh: '最后验证',
    en: 'Last Verified'
  },
  verificationStatus: {
    zh: '验证状态',
    en: 'Verification Status'
  },
  verifyingCoreData: {
    zh: '验证核心数据：剩余私募池代币、已售代币总量',
    en: 'Verifying core data: remaining private sale tokens, total sold tokens'
  },
  verifyingDappChainDataConsistency: {
    zh: '验证DAPP数据与链上数据的一致性',
    en: 'Verifying consistency between DAPP data and blockchain data'
  },
  normal: {
    zh: '✓ 正常',
    en: '✓ Normal'
  },
  abnormal: {
    zh: '✗ 异常',
    en: '✗ Abnormal'
  },
  success: {
    zh: '✓ 一致',
    en: '✓ Consistent'
  },
  failure: {
    zh: '✗ 不一致',
    en: '✗ Inconsistent'
  },
  pending: {
    zh: '未获得',
    en: 'Not Obtained'
  },
  obtained: {
    zh: '已获得',
    en: 'Obtained'
  },
  no: {
    zh: '无',
    en: 'None'
  },
  yes: {
    zh: '有',
    en: 'Yes'
  },
  member: {
    zh: '会员',
    en: 'Member'
  },
  city: {
    zh: '市级',
    en: 'City'
  },
  province: {
    zh: '省级',
    en: 'Province'
  },
  national: {
    zh: '国家级',
    en: 'National'
  },
  
  // Profile页面推荐树模态框
  purchaseDetails: {
    zh: '被推荐人购买明细',
    en: 'Referral Purchase Details'
  },
  referredUser: {
    zh: '被推荐人',
    en: 'Referred User'
  },
  purchaseAmount: {
    zh: '购买SCIA数量',
    en: 'SCIA Purchase Amount'
  },
  purchaseValue: {
    zh: '购买USDT金额',
    en: 'USDT Purchase Value'
  },
  referralStructure: {
    zh: '推荐树结构',
    en: 'Referral Structure'
  },
  noReferralRelationship: {
    zh: '暂无推荐关系',
    en: 'No referral relationships'
  },
  noPurchaseRecords: {
    zh: '暂无被推荐人购买记录',
    en: 'No referral purchase records yet'
  },
  purchaseNote: {
    zh: '注：以上为被推荐人的真实购买数据，推荐奖励根据合约规则（USDT 5% + SCIA 5%）自动计算',
    en: 'Note: The above are the actual purchase data of referred users. Referral rewards are automatically calculated according to contract rules (5% USDT + 5% SCIA)'
  },
  
  // NFT页面
  nftPage: {
    zh: 'NFT',
    en: 'NFT'
  },
  
  // 商城页面
  mallPage: {
    zh: '商城',
    en: 'Mall'
  },
  mallFunction: {
    zh: '商城功能',
    en: 'Mall Features'
  },
  nftFunction: {
    zh: 'NFT功能',
    en: 'NFT Features'
  },
  
  // 数据页面补充
  statistics: {
    zh: '数据',
    en: 'Statistics'
  },
  deviceCompatibility: {
    zh: '设备兼容性',
    en: 'Device Compatibility'
  },
  walletInfoVerification: {
    zh: '钱包信息验证',
    en: 'Wallet Info Verification'
  },
  package: {
    zh: '份',
    en: 'Package'
  },
  packages: {
    zh: '份',
    en: 'Packages'
  },
  totalSales: {
    zh: '总销售额',
    en: 'Total Sales'
  },
  soldTokens: {
    zh: '已售代币',
    en: 'Sold Tokens'
  },
  remainingTokens: {
    zh: '剩余代币',
    en: 'Remaining Tokens'
  },
  participants: {
    zh: '参与用户',
    en: 'Participants'
  },
  memberBadge: {
    zh: '会员徽章',
    en: 'Member Badge'
  },
  cityBadge: {
    zh: '市级徽章',
    en: 'City Badge'
  },
  provinceBadge: {
    zh: '省级徽章',
    en: 'Province Badge'
  },
  nationalBadge: {
    zh: '国家级徽章',
    en: 'National Badge'
  },
  terminalVerification: {
    zh: '终端验证中心',
    en: 'Terminal Verification Center'
  },
  salesProgress: {
    zh: '销售进度',
    en: 'Sales Progress'
  },
  realTime: {
    zh: '实时',
    en: 'Real-time'
  },
  updateInterval: {
    zh: '{{seconds}}秒更新',
    en: 'Update every {{seconds}} seconds'
  },
  dataSync: {
    zh: '数据同步',
    en: 'Data Sync'
  },
  realTimeUpdate: {
    zh: '实时更新中...',
    en: 'Real-time Update...'
  },
  currentDevice: {
    zh: '当前设备',
    en: 'Current Device'
  },
  people: {
    zh: '人',
    en: 'Person'
  },
  pointsRequired: {
    zh: '{{points}} USDT积分即可获得',
    en: '{{points}} USDT points required'
  },
  referralStats: {
    zh: '推荐统计',
    en: 'Referral Statistics'
  },
  totalReferrals: {
    zh: '总推荐人数',
    en: 'Total Referrals'
  },
  totalUSDT: {
    zh: '总USDT奖励',
    en: 'Total USDT Reward'
  },
  totalSCIA: {
    zh: '总SCIA奖励',
    en: 'Total SCIA Reward'
  },
  loadingTree: {
    zh: '正在加载推荐树...',
    en: 'Loading referral tree...'
  },
};

// 定义Context类型
interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

// 创建Context
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Provider组件属性类型
interface LanguageProviderProps {
  children: ReactNode;
}

// Provider组件
export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  // 从localStorage获取初始语言，默认为中文
  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem('language') as Language | null;
    return savedLanguage || 'zh';
  });

  // 更新语言并保存到localStorage
  const updateLanguage = (lang: Language) => {
    setCurrentLanguage(lang);
    localStorage.setItem('language', lang);
  };

  // 翻译函数
  const translate = (key: string, params?: Record<string, string | number>): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }

    let text = translation[currentLanguage];
    
    // 处理参数替换
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        text = text.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(value));
      });
    }

    return text;
  };

  const contextValue: LanguageContextType = {
    currentLanguage,
    setLanguage: updateLanguage,
    t: translate
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

// 自定义Hook，方便组件使用Context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
