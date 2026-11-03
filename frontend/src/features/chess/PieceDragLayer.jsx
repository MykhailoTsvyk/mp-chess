import {useDragLayer} from "react-dnd"
import {pieceImages} from "./pieceImages.js"
import {PIECE} from "./dragTypes.js"

// draws the dragged piece under the cursor or finger, at full size and opacity
export default function PieceDragLayer() {
    const {item, itemType, isDragging, offset} = useDragLayer((monitor) => ({
        item: monitor.getItem(),
        itemType: monitor.getItemType(),
        isDragging: monitor.isDragging(),
        offset: monitor.getClientOffset(),
    }))

    if (!isDragging || itemType !== PIECE || !offset) return null

    const size = item.size || 64

    return (
        <div className="pointer-events-none fixed inset-0 z-50">
            <img
                src={pieceImages[`${item.piece.color}${item.piece.type}`]}
                alt=""
                className="absolute left-0 top-0 object-contain p-1"
                style={{
                    width: size,
                    height: size,
                    // centred on the pointer
                    transform: `translate(${offset.x - size / 2}px, ${offset.y - size / 2}px)`,
                }}
            />
        </div>
    )
}
