import { describe, it, expect } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { useBoardPan } from './use-board-pan'

function Panel({ children }: { children?: React.ReactNode }) {
  const { offset, bind, isPanning } = useBoardPan()
  return (
    <div
      data-testid="panel"
      data-panning={isPanning ? 'true' : 'false'}
      data-offset={`${offset.x},${offset.y}`}
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
      {...bind}
    >
      {children}
    </div>
  )
}

describe('useBoardPan', () => {
  it('updates the offset by the pointer delta while dragging', () => {
    render(<Panel />)
    const panel = screen.getByTestId('panel')

    fireEvent.pointerDown(panel, { button: 0, clientX: 100, clientY: 100 })
    expect(panel.dataset.panning).toBe('true')

    act(() => {
      window.dispatchEvent(new PointerEvent('pointermove', { clientX: 130, clientY: 115 }))
    })
    expect(panel.dataset.offset).toBe('30,15')

    act(() => {
      window.dispatchEvent(new PointerEvent('pointerup', {}))
    })
    expect(panel.dataset.panning).toBe('false')
  })

  it('does not start a pan when pointerdown originates from a data-no-pan element', () => {
    render(
      <Panel>
        <button data-no-pan data-testid="note">
          note
        </button>
      </Panel>,
    )

    fireEvent.pointerDown(screen.getByTestId('note'), {
      button: 0,
      clientX: 0,
      clientY: 0,
    })
    expect(screen.getByTestId('panel').dataset.panning).toBe('false')
  })

  it('ignores non-primary button presses', () => {
    render(<Panel />)
    fireEvent.pointerDown(screen.getByTestId('panel'), {
      button: 2,
      clientX: 0,
      clientY: 0,
    })
    expect(screen.getByTestId('panel').dataset.panning).toBe('false')
  })

  it('preserves the previous offset across successive drags', () => {
    render(<Panel />)
    const panel = screen.getByTestId('panel')

    fireEvent.pointerDown(panel, { button: 0, clientX: 0, clientY: 0 })
    act(() => {
      window.dispatchEvent(new PointerEvent('pointermove', { clientX: 40, clientY: 10 }))
      window.dispatchEvent(new PointerEvent('pointerup', {}))
    })
    expect(panel.dataset.offset).toBe('40,10')

    fireEvent.pointerDown(panel, { button: 0, clientX: 100, clientY: 100 })
    act(() => {
      window.dispatchEvent(new PointerEvent('pointermove', { clientX: 110, clientY: 90 }))
      window.dispatchEvent(new PointerEvent('pointerup', {}))
    })
    expect(panel.dataset.offset).toBe('50,0')
  })
})
