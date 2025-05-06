import React from 'react';
import { ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SvgUri } from 'react-native-svg';

import { openEmail, openURL } from '@/lib/utils';
import { linkIconNames } from '@inkverse/shared-client/utils/link-icons';
import { type LinkDetails, type Maybe, LinkType } from '@inkverse/shared-client/graphql/operations';
import { useThemeColor } from '@/constants/Colors';

interface CreatorLinksProps {
  links?: Maybe<Maybe<LinkDetails>[]> | undefined;
  passedInLightColor?: string;
  passedInDarkColor?: string;
}

interface SafeLinkDetails {
  type: LinkType;
  url: string;
}

export function CreatorLinks({ links, passedInLightColor, passedInDarkColor }: CreatorLinksProps) {
  if (!links || links.length === 0) return null;

  const safeLinks = links.filter((link): link is SafeLinkDetails => 
    link !== null && 
    link.type !== null && 
    link.type !== undefined &&
    link.url !== null && 
    link.url !== undefined
  );

  if (safeLinks.length === 0) return null;
  const color = useThemeColor({ light: passedInLightColor, dark: passedInDarkColor }, 'text');

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.linksContainer}
      contentContainerStyle={styles.linksContentContainer}
    >
      {safeLinks.map((link, index) => {
        const onPress = () => {
          link.type === LinkType.EMAIL ? openEmail({ toAddress: link.url }) : openURL({ url: link.url });
        };

        const iconName = linkIconNames[link.type];

        return (
          <TouchableOpacity 
            key={`${link.type}-${link.url}`}
            onPress={onPress}
            style={styles.linkButton}
          >
            <SvgUri
              width={24}
              height={24}
              uri={`https://ax0.taddy.org/brands/${iconName}.svg`}
              fill={color}
              color={color}
              style={styles.linkIcon}
            />
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  linksContainer: {
    width: '100%',
    paddingBottom: 4,
  },
  linksContentContainer: {
    flexDirection: 'row',
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkButton: {
    marginRight: 16,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkIcon: {
    opacity: 1,
  },
}); 