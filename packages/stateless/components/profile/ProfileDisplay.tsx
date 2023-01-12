/* eslint-disable i18next/no-literal-string */
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'

import { ProfileDisplayProps } from '@dao-dao/types'
import { getFallbackImage, toAccessibleImageUrl } from '@dao-dao/utils'

import { CopyToClipboardUnderline } from '../CopyToClipboard'
import { Tooltip } from '../tooltip/Tooltip'

export const ProfileDisplay = ({
  address,
  loadingProfile,
  imageSize,
  hideImage,
  copyToClipboardProps,
  size = 'default',
  className,
  noImageTooltip,
  noCopy,
}: ProfileDisplayProps) => {
  const { t } = useTranslation()

  imageSize ??= size === 'lg' ? 28 : 20

  return (
    <div className={clsx('flex flex-row items-center gap-2', className)}>
      {!hideImage && (
        <Tooltip
          title={
            noImageTooltip
              ? undefined
              : !loadingProfile.loading && loadingProfile.data.name
              ? loadingProfile.data.name
              : address
          }
        >
          <div
            className="shrink-0 rounded-full bg-cover bg-center"
            style={{
              backgroundImage: `url(${
                loadingProfile.loading
                  ? getFallbackImage(address)
                  : toAccessibleImageUrl(loadingProfile.data.imageUrl)
              })`,
              width: imageSize,
              height: imageSize,
            }}
          ></div>
        </Tooltip>
      )}

      <CopyToClipboardUnderline
        noCopy={noCopy}
        takeStartEnd={{
          start: 6,
          end: 4,
        }}
        tooltip={
          // If displaying name, show tooltip to copy address.
          !loadingProfile.loading && loadingProfile.data.name
            ? t('button.clickToCopyAddress')
            : undefined
        }
        {...{
          ...copyToClipboardProps,
          textClassName: clsx(
            {
              'text-sm': size === 'default',
              'text-lg': size === 'lg',
            },
            copyToClipboardProps?.textClassName
          ),
        }}
        className={clsx(
          loadingProfile.loading && 'animate-pulse',
          copyToClipboardProps?.className
        )}
        label={
          (!loadingProfile.loading && loadingProfile.data.name) || undefined
        }
        // If name exists, use that. Otherwise, will fall back to truncated
        // address display.
        value={address}
      />
    </div>
  )
}
