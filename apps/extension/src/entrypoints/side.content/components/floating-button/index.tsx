import { Icon } from '@iconify/react'
import { cn } from '@repo/ui/lib/utils'
import { useAtom, useAtomValue } from 'jotai'
import { useEffect, useRef } from 'react'
import readFrogLogo from '@/assets/icons/read-frog.png'
import { configFields } from '@/utils/atoms/config'
import { APP_NAME } from '@/utils/constants/app'
import { removeAllTranslatedWrapperNodes } from '@/utils/host/translate/node-manipulation'
import { validateTranslationConfig } from '@/utils/host/translate/translate-text'
import { sendMessage } from '@/utils/message'
import { enablePageTranslationAtom, isDraggingButtonAtom } from '../../atoms'
import HiddenButton from './components/hidden-button'
import TranslateButton from './translate-button'

export default function FloatingButton() {
  const [floatingButton, setFloatingButton] = useAtom(
    configFields.floatingButton,
  )
  const [isDraggingButton, setIsDraggingButton] = useAtom(isDraggingButtonAtom)
  const enablePageTranslation = useAtomValue(enablePageTranslationAtom)
  const providersConfig = useAtomValue(configFields.providersConfig)
  const translateConfig = useAtomValue(configFields.translate)
  const languageConfig = useAtomValue(configFields.language)
  const initialClientYRef = useRef<number | null>(null)

  // 按钮拖动处理
  useEffect(() => {
    const initialClientY = initialClientYRef.current
    if (!isDraggingButton || !initialClientY || !floatingButton)
      return

    const handleMouseMove = (e: MouseEvent) => {
      const initialY = floatingButton.position * window.innerHeight
      const newY = Math.max(
        30,
        Math.min(
          window.innerHeight - 200,
          initialY + e.clientY - initialClientY,
        ),
      )
      const newPosition = newY / window.innerHeight
      setFloatingButton({ position: newPosition })
    }

    const handleMouseUp = () => {
      setIsDraggingButton(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    document.body.style.userSelect = 'none'

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = ''
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDraggingButton])

  const handleButtonDragStart = (e: React.MouseEvent) => {
    // 记录初始位置，用于后续判断是点击还是拖动
    initialClientYRef.current = e.clientY
    let hasMoved = false // 标记是否发生了移动

    e.preventDefault()
    setIsDraggingButton(true)

    // 创建一个监听器检测移动
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const moveDistance = Math.abs(moveEvent.clientY - e.clientY)
      // 如果移动距离大于阈值，标记为已移动
      if (moveDistance > 5) {
        hasMoved = true
      }
    }

    // 在鼠标释放时，只有未移动才触发点击事件
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)

      // 只有未移动过才触发翻译功能
      if (!hasMoved) {
        if (!enablePageTranslation) {
          if (!validateTranslationConfig({
            providersConfig,
            translate: translateConfig,
            language: languageConfig,
          })) {
            return
          }
          sendMessage('setEnablePageTranslationOnContentScript', {
            enabled: true,
          })
        }
        else {
          removeAllTranslatedWrapperNodes()
          sendMessage('setEnablePageTranslationOnContentScript', {
            enabled: false,
          })
        }
      }
    }

    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mousemove', handleMouseMove)
  }

  if (!floatingButton.enabled) {
    return null
  }

  return (
    <div
      className="group fixed z-[2147483647] flex flex-col items-end gap-2 print:hidden"
      style={{
        right: 'var(--removed-body-scroll-bar-size, 0px)',
        top: `${floatingButton.position * 100}vh`,
      }}
    >
      <TranslateButton />
      <div
        className={cn(
          'border-border flex h-10 w-15 items-center rounded-l-full border border-r-0 bg-white opacity-60 shadow-lg group-hover:opacity-100 dark:bg-neutral-900',
          'translate-x-5 transition-transform duration-300 group-hover:translate-x-0',
          enablePageTranslation && 'opacity-100',
          isDraggingButton ? 'cursor-move' : 'cursor-pointer',
          isDraggingButton ? 'translate-x-0' : '',
        )}
        onMouseDown={handleButtonDragStart}
      >
        <div
          title="Close floating button"
          className={cn(
            'border-border absolute -top-1 -left-1 hidden cursor-pointer rounded-full border bg-neutral-100 dark:bg-neutral-900',
            'group-hover:block',
          )}
          onMouseDown={e => e.stopPropagation()} // 父级不会收到 mousedown
          onClick={(e) => {
            e.stopPropagation() // 父级不会收到 click
            setFloatingButton({ enabled: false })
          }}
        >
          <Icon icon="tabler:x" className="h-3 w-3 text-neutral-400 dark:text-neutral-600" />
        </div>
        <img
          src={readFrogLogo}
          alt={APP_NAME}
          className="ml-[5px] h-8 w-8 rounded-full"
        />
        <Icon
          icon="tabler:check"
          className={cn(
            'absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full bg-green-500 text-white',
            enablePageTranslation ? 'block' : 'hidden',
          )}
        />
      </div>
      <HiddenButton
        className={(isDraggingButton ? 'translate-x-0' : '')}
        icon="tabler:settings"
        onClick={() => {
          sendMessage('openOptionsPage', undefined)
        }}
      />
    </div>
  )
}
