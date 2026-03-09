import React from 'react';
import { usePresentationStore } from '@/stores/presentationStore';
import {
  AlignHorizontalJustifyStart, AlignHorizontalJustifyCenter, AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd,
  AlignHorizontalSpaceAround, AlignVerticalSpaceAround,
  ArrowUpToLine, ArrowDownToLine, ArrowUp, ArrowDown,
  RectangleHorizontal, RectangleVertical, Square,
  MoveHorizontal, MoveVertical,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

type AlignType = 'left' | 'center-h' | 'right' | 'top' | 'middle-v' | 'bottom';
type DistributeType = 'horizontal' | 'vertical';
type SizeMatchType = 'width' | 'height' | 'both';
type ArrangeType = 'front' | 'back' | 'forward' | 'backward';

export const AlignmentToolbar: React.FC = () => {
  const { selectedObjectIds, presentation, currentSlideIndex, updateObject, pushHistory } = usePresentationStore();
  const slide = presentation.slides[currentSlideIndex];
  if (!slide || selectedObjectIds.length === 0) return null;

  const selectedObjects = slide.objects.filter(o => selectedObjectIds.includes(o.id));

  const align = (type: AlignType) => {
    if (selectedObjects.length < 1) return;
    pushHistory();
    const objs = selectedObjects;

    switch (type) {
      case 'left': {
        const minX = Math.min(...objs.map(o => o.position.x));
        objs.forEach(o => updateObject(currentSlideIndex, o.id, { position: { ...o.position, x: minX } }));
        break;
      }
      case 'center-h': {
        const minX = Math.min(...objs.map(o => o.position.x));
        const maxX = Math.max(...objs.map(o => o.position.x + o.size.width));
        const centerX = (minX + maxX) / 2;
        objs.forEach(o => updateObject(currentSlideIndex, o.id, { position: { ...o.position, x: centerX - o.size.width / 2 } }));
        break;
      }
      case 'right': {
        const maxX = Math.max(...objs.map(o => o.position.x + o.size.width));
        objs.forEach(o => updateObject(currentSlideIndex, o.id, { position: { ...o.position, x: maxX - o.size.width } }));
        break;
      }
      case 'top': {
        const minY = Math.min(...objs.map(o => o.position.y));
        objs.forEach(o => updateObject(currentSlideIndex, o.id, { position: { ...o.position, y: minY } }));
        break;
      }
      case 'middle-v': {
        const minY = Math.min(...objs.map(o => o.position.y));
        const maxY = Math.max(...objs.map(o => o.position.y + o.size.height));
        const centerY = (minY + maxY) / 2;
        objs.forEach(o => updateObject(currentSlideIndex, o.id, { position: { ...o.position, y: centerY - o.size.height / 2 } }));
        break;
      }
      case 'bottom': {
        const maxY = Math.max(...objs.map(o => o.position.y + o.size.height));
        objs.forEach(o => updateObject(currentSlideIndex, o.id, { position: { ...o.position, y: maxY - o.size.height } }));
        break;
      }
    }
  };

  const distribute = (type: DistributeType) => {
    if (selectedObjects.length < 3) return;
    pushHistory();
    const objs = [...selectedObjects];

    if (type === 'horizontal') {
      objs.sort((a, b) => a.position.x - b.position.x);
      const minX = objs[0].position.x;
      const maxX = objs[objs.length - 1].position.x + objs[objs.length - 1].size.width;
      const totalWidth = objs.reduce((sum, o) => sum + o.size.width, 0);
      const spacing = (maxX - minX - totalWidth) / (objs.length - 1);
      let currentX = minX;
      objs.forEach(o => {
        updateObject(currentSlideIndex, o.id, { position: { ...o.position, x: currentX } });
        currentX += o.size.width + spacing;
      });
    } else {
      objs.sort((a, b) => a.position.y - b.position.y);
      const minY = objs[0].position.y;
      const maxY = objs[objs.length - 1].position.y + objs[objs.length - 1].size.height;
      const totalHeight = objs.reduce((sum, o) => sum + o.size.height, 0);
      const spacing = (maxY - minY - totalHeight) / (objs.length - 1);
      let currentY = minY;
      objs.forEach(o => {
        updateObject(currentSlideIndex, o.id, { position: { ...o.position, y: currentY } });
        currentY += o.size.height + spacing;
      });
    }
  };

  const matchSize = (dim: SizeMatchType) => {
    if (selectedObjects.length < 2) return;
    pushHistory();
    const ref = selectedObjects[0];
    selectedObjects.slice(1).forEach(o => {
      const size = { ...o.size };
      if (dim === 'width' || dim === 'both') size.width = ref.size.width;
      if (dim === 'height' || dim === 'both') size.height = ref.size.height;
      updateObject(currentSlideIndex, o.id, { size });
    });
  };

  const arrange = (dir: ArrangeType) => {
    pushHistory();
    const allZ = slide.objects.map(o => o.zIndex);
    const maxZ = Math.max(...allZ, 0);

    selectedObjects.forEach(o => {
      let newZ = o.zIndex;
      switch (dir) {
        case 'front': newZ = maxZ + 1; break;
        case 'back': newZ = 0; break;
        case 'forward': newZ = o.zIndex + 1; break;
        case 'backward': newZ = Math.max(0, o.zIndex - 1); break;
      }
      updateObject(currentSlideIndex, o.id, { zIndex: newZ });
    });
  };

  const adjustSpacing = (axis: 'h' | 'v', delta: number) => {
    if (selectedObjects.length < 2) return;
    pushHistory();
    const objs = [...selectedObjects];
    if (axis === 'h') {
      objs.sort((a, b) => a.position.x - b.position.x);
      objs.forEach((o, i) => {
        if (i === 0) return;
        updateObject(currentSlideIndex, o.id, { position: { ...o.position, x: o.position.x + delta * i } });
      });
    } else {
      objs.sort((a, b) => a.position.y - b.position.y);
      objs.forEach((o, i) => {
        if (i === 0) return;
        updateObject(currentSlideIndex, o.id, { position: { ...o.position, y: o.position.y + delta * i } });
      });
    }
  };

  const Btn: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean }> = ({ icon, label, onClick, disabled }) => (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            disabled={disabled}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-[hsl(var(--muted-foreground))]"
          >
            {icon}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const iconSize = 14;
  const multiSelected = selectedObjects.length >= 2;
  const tripleSelected = selectedObjects.length >= 3;

  return (
    <div className="flex items-center gap-0.5 px-2 py-1 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-md shadow-sm">
      {/* Align */}
      <Btn icon={<AlignHorizontalJustifyStart size={iconSize} />} label="Align Left (Ctrl+Shift+L)" onClick={() => align('left')} />
      <Btn icon={<AlignHorizontalJustifyCenter size={iconSize} />} label="Align Center H (Ctrl+Shift+E)" onClick={() => align('center-h')} />
      <Btn icon={<AlignHorizontalJustifyEnd size={iconSize} />} label="Align Right (Ctrl+Shift+R)" onClick={() => align('right')} />
      <Btn icon={<AlignVerticalJustifyStart size={iconSize} />} label="Align Top (Ctrl+Shift+T)" onClick={() => align('top')} />
      <Btn icon={<AlignVerticalJustifyCenter size={iconSize} />} label="Align Middle V (Ctrl+Shift+M)" onClick={() => align('middle-v')} />
      <Btn icon={<AlignVerticalJustifyEnd size={iconSize} />} label="Align Bottom (Ctrl+Shift+B)" onClick={() => align('bottom')} />

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* Distribute */}
      <Btn icon={<AlignHorizontalSpaceAround size={iconSize} />} label="Distribute Horizontally" onClick={() => distribute('horizontal')} disabled={!tripleSelected} />
      <Btn icon={<AlignVerticalSpaceAround size={iconSize} />} label="Distribute Vertically" onClick={() => distribute('vertical')} disabled={!tripleSelected} />

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* Size */}
      <Btn icon={<RectangleHorizontal size={iconSize} />} label="Match Width" onClick={() => matchSize('width')} disabled={!multiSelected} />
      <Btn icon={<RectangleVertical size={iconSize} />} label="Match Height" onClick={() => matchSize('height')} disabled={!multiSelected} />
      <Btn icon={<Square size={iconSize} />} label="Match Size" onClick={() => matchSize('both')} disabled={!multiSelected} />

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* Arrange */}
      <Btn icon={<ArrowUpToLine size={iconSize} />} label="Bring to Front" onClick={() => arrange('front')} />
      <Btn icon={<ArrowUp size={iconSize} />} label="Bring Forward (Ctrl+Shift+])" onClick={() => arrange('forward')} />
      <Btn icon={<ArrowDown size={iconSize} />} label="Send Backward (Ctrl+Shift+[)" onClick={() => arrange('backward')} />
      <Btn icon={<ArrowDownToLine size={iconSize} />} label="Send to Back" onClick={() => arrange('back')} />

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* Spacing */}
      <Btn icon={<MoveHorizontal size={iconSize} />} label="Increase H Spacing" onClick={() => adjustSpacing('h', 5)} disabled={!multiSelected} />
      <Btn icon={<MoveVertical size={iconSize} />} label="Increase V Spacing" onClick={() => adjustSpacing('v', 5)} disabled={!multiSelected} />
    </div>
  );
};
