import React from 'react';
import { Card, Button, List, Typography, Divider, Tag } from 'antd';
import { RoomInfo, OFFICIAL_HOST_WALLET_ADDRESSES } from '../../lib/livekit-config';

const { Title, Text } = Typography;

interface RoomListProps {
  rooms: RoomInfo[];
  hasSciaBalance: boolean;
  onRoomClick: (room: RoomInfo) => void;
  onCreateRoom: () => void;
  currentUser?: string | undefined;
}

// 深色主题样式
const darkThemeStyles = {
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    margin: '20px 0',
    color: '#ffffff'
  },
  cardHeader: {
    color: '#ffffff',
    fontSize: '18px',
    fontWeight: 'bold'
  },
  divider: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)'
  },
  listItem: {
    cursor: 'pointer',
    borderRadius: '8px',
    marginBottom: '8px',
    transition: 'all 0.3s',
    padding: '16px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderColor: 'rgba(255, 255, 255, 0.2)'
    }
  },
  title: {
    color: '#ffffff',
    fontSize: '16px'
  },
  textSecondary: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '14px'
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.4)'
  }
};

const RoomList: React.FC<RoomListProps> = ({ rooms, hasSciaBalance, onRoomClick, onCreateRoom, currentUser }) => {
  // 检查当前用户是否是管理员
  const isAdmin = OFFICIAL_HOST_WALLET_ADDRESSES.includes(currentUser?.toLowerCase() || '');
  
  return (
    <Card style={darkThemeStyles.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <Title level={4} style={darkThemeStyles.cardHeader}>直播间列表</Title>
        {isAdmin ? (
          <Button type="primary" onClick={onCreateRoom}>
            开播
          </Button>
        ) : hasSciaBalance ? (
          <Button type="primary" onClick={onCreateRoom}>
            创建直播间
          </Button>
        ) : (
          <Button type="primary" disabled>
            缺少SCIA余额
          </Button>
        )}
      </div>
      <Divider style={darkThemeStyles.divider} />
      {rooms.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: darkThemeStyles.emptyText.color }}>
          <Text style={darkThemeStyles.emptyText}>暂无可用直播间</Text>
        </div>
      ) : (
        <List
          dataSource={rooms}
          renderItem={(room) => (
            <List.Item
            key={room.id}
            onClick={() => onRoomClick(room)}
            style={darkThemeStyles.listItem}
          >
              <List.Item.Meta
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <Text strong style={darkThemeStyles.title}>{room.name}</Text>
                    {room.type === 'official' && (
                      <Tag color="blue" style={{ fontSize: '12px' }}>
                        官方
                      </Tag>
                    )}
                    {room.isLive && (
                      <Tag color="green" style={{ fontSize: '12px' }}>
                        直播中
                      </Tag>
                    )}
                  </div>
                }
                description={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
                    <Text style={darkThemeStyles.textSecondary}>
                      参与人数: {room.participants}
                    </Text>
                    <Text style={darkThemeStyles.textSecondary}>
                      类型: {room.type === 'official' ? '官方直播间' : '用户直播间'}
                    </Text>
                    {room.creator && (
                      <Text style={darkThemeStyles.textSecondary}>
                        创建者: {room.creator.slice(0, 6)}...{room.creator.slice(-4)}
                      </Text>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  );
};

export default RoomList;