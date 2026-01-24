import { setupParticipantName } from '@livekit/components-core';
import * as React from 'react';
import { useEnsureParticipant } from '../../context';
import { useObservableState } from '../../hooks/internal/useObservableState';
import { mergeProps } from '../../utils';
import type { UseParticipantInfoOptions } from '../../hooks';

/** @public */
export interface ParticipantNameProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    UseParticipantInfoOptions {}

/**
 * The `ParticipantName` component displays the name of the participant as a string within an HTML span element.
 * If no participant name is undefined the participant identity string is displayed.
 *
 * @example
 * ```tsx
 * <ParticipantName />
 * ```
 * @public
 */
export const ParticipantName: (
  props: ParticipantNameProps & React.RefAttributes<HTMLSpanElement>,
) => React.ReactNode = /* @__PURE__ */ React.forwardRef<HTMLSpanElement, ParticipantNameProps>(
  function ParticipantName({ participant, ...props }: ParticipantNameProps, ref) {
    const p = useEnsureParticipant(participant);

    const { className, infoObserver } = React.useMemo(() => {
      return setupParticipantName(p);
    }, [p]);

    const { identity, name } = useObservableState(infoObserver, {
      name: p.name,
      identity: p.identity,
      metadata: p.metadata,
    });

    // 处理钱包地址显示，只显示后四位
    const formatWalletAddress = (address: string) => {
      if (!address) return '';
      // 如果是钱包地址，只显示后四位
      if (address.startsWith('0x')) {
        return `0x${address.slice(-4)}`;
      }
      // 否则显示完整名称
      return address;
    };

    const mergedProps = React.useMemo(() => {
      return mergeProps(props, { className, 'data-lk-participant-name': name });
    }, [props, className, name]);

    return (
      <span ref={ref} {...mergedProps}>
        {/* 只显示钱包地址的后四位 */}
        {name !== '' ? formatWalletAddress(name) : formatWalletAddress(identity)}
        {props.children}
      </span>
    );
  },
);
