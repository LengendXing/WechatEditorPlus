# Stage 1: BlockRegistry + MBDoc Schema 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 引入 Block 化文档模型 `MBDoc`，提供 `BlockRegistry` 抽象和 `render_for_wechat(doc, ctx)` 单一入口函数，新增 `/api/v1/mbdoc` CRUD + render 端点。旧 `/articles` 端点**保持不变**，两条管线平行运行到 Stage 6。

**Architecture:**
- 后端新增 `app/models/mbdoc.py`（Pydantic schema）、`app/services/block_registry.py`（注册/路由）、`app/services/render_for_wechat.py`（单一渲染入口）
- 存储：`data/mbdocs/{id}.json`（平铺 JSON 文件，类似现有 `data/articles/`）
- 新增 API：`/api/v1/mbdoc` 路由组，提供 CRUD + `/render` + `/publish` 占位端点
- 所有 block 在 Stage 1 都是 "stub renderer" 状态（`heading` / `paragraph` 简单可用，其它 block 返回"未实现"警告）—— Stage 2-5 逐个填充真实 renderer

**Tech Stack:** FastAPI + Pydantic v2 + pytest + 项目现有存储模式

**Prerequisites:** Stage 0 已完成并合并到主分支。

**Completion criteria（DoD）:**
- `POST /api/v1/mbdoc` 创建成功并持久化到 `data/mbdocs/{id}.json`
- `GET /api/v1/mbdoc/{id}` 读取成功
- `PUT /api/v1/mbdoc/{id}` 更新成功
- `DELETE /api/v1/mbdoc/{id}` 删除成功
- `POST /api/v1/mbdoc/{id}/render?uploadImages=false` 返回渲染结果 HTML
- `POST /api/v1/mbdoc/{id}/render?uploadImages=true` 返回渲染结果（Stage 1 的图片处理是 pass-through，实际上传逻辑在 Stage 3）
- 单元测试：同一个 MBDoc 在 `uploadImages=true/false` 两次调用下，产出的 HTML diff **只在 `<img src>` 属性**（本 Stage 通过 mock image uploader 验证）
- 单元测试：未知 block type 抛出 `UnknownBlockTypeError`
- 端到端测试：POST → GET → PUT → render → DELETE 闭环
- 旧 `/articles` 和 `/publish/*` 端点行为未受影响（冒烟）
- skill 文件新增"MBDoc 文档模型"章节

---

## File Structure

**Backend (create):**
- `backend/app/models/__init__.py`（若不存在）
- `backend/app/models/mbdoc.py` — Pydantic schema: `MBDoc`, `Block` 各子类, `BlockType` enum
- `backend/app/services/block_registry.py` — `BlockRegistry` + `UnknownBlockTypeError`
- `backend/app/services/renderers/__init__.py`
- `backend/app/services/renderers/base.py` — `BlockRenderer` 抽象基类
- `backend/app/services/renderers/stub.py` — `StubBlockRenderer`（Stage 1 占位）
- `backend/app/services/render_for_wechat.py` — `render_for_wechat(doc, ctx)` 主入口
- `backend/app/services/mbdoc_storage.py` — 文件存储
- `backend/app/api/v1/mbdoc.py` — 路由组
- `backend/tests/test_mbdoc_model.py`
- `backend/tests/test_block_registry.py`
- `backend/tests/test_render_for_wechat.py`
- `backend/tests/test_mbdoc_api.py`

**Backend (modify):**
- `backend/app/api/v1/router.py` — 注册 mbdoc 路由

**Storage:**
- `data/mbdocs/` 目录（代码运行时自动创建）

**Frontend：Stage 1 不动前端，仅提供后端 API。前端迁移放在 Stage 6。**

**Docs:**
- Modify: `skill/mbeditor.skill.md` — 新增 MBDoc 章节

---

## Task 1: 创建分支

- [ ] **Step 1: 分支切换**

Run:
```bash
cd D:/Web/MBEditor
git checkout main 2>/dev/null || git checkout master
git pull 2>/dev/null || true
git checkout -b stage-1/block-registry
```

---

## Task 2: 设计并实现 MBDoc Pydantic 模型

**Files:**
- Create: `backend/app/models/__init__.py`
- Create: `backend/app/models/mbdoc.py`
- Create: `backend/tests/test_mbdoc_model.py`

- [ ] **Step 1: 创建 models 包**

Run:
```bash
cd D:/Web/MBEditor/backend
mkdir -p app/models
test -f app/models/__init__.py || touch app/models/__init__.py
```

- [ ] **Step 2: 写失败的测试**

Create `backend/tests/test_mbdoc_model.py`:
```python
"""Tests for MBDoc Pydantic schema."""
import json
import pytest
from pydantic import ValidationError

from app.models.mbdoc import (
    MBDoc,
    MBDocMeta,
    BlockType,
    HeadingBlock,
    ParagraphBlock,
    MarkdownBlock,
    HtmlBlock,
    ImageBlock,
    SvgBlock,
    RasterBlock,
)


def test_heading_block_basic():
    block = HeadingBlock(id="b1", level=1, text="Hello")
    assert block.type == BlockType.HEADING
    assert block.level == 1


def test_heading_level_validation():
    with pytest.raises(ValidationError):
        HeadingBlock(id="b1", level=7, text="Hello")  # max is 6


def test_paragraph_block():
    block = ParagraphBlock(id="b2", text="World")
    assert block.type == BlockType.PARAGRAPH


def test_markdown_block():
    block = MarkdownBlock(id="b3", source="## Heading\n\nbody")
    assert block.type == BlockType.MARKDOWN


def test_html_block():
    block = HtmlBlock(id="b4", source="<section>hi</section>")
    assert block.type == BlockType.HTML


def test_image_block():
    block = ImageBlock(id="b5", src="/images/x.png", alt="x")
    assert block.type == BlockType.IMAGE


def test_svg_block():
    svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="red"/></svg>'
    block = SvgBlock(id="b6", source=svg)
    assert block.type == BlockType.SVG


def test_raster_block():
    block = RasterBlock(
        id="b7",
        html='<div style="display:grid;">x</div>',
        css=".x{color:red;}",
    )
    assert block.type == BlockType.RASTER


def test_mbdoc_empty():
    doc = MBDoc(id="doc1", meta=MBDocMeta(title="Test"))
    assert doc.version == "1"
    assert doc.blocks == []


def test_mbdoc_with_blocks():
    doc = MBDoc(
        id="doc1",
        meta=MBDocMeta(title="T"),
        blocks=[
            HeadingBlock(id="b1", level=1, text="H"),
            ParagraphBlock(id="b2", text="P"),
        ],
    )
    assert len(doc.blocks) == 2
    assert doc.blocks[0].type == BlockType.HEADING
    assert doc.blocks[1].type == BlockType.PARAGRAPH


def test_mbdoc_json_roundtrip():
    doc = MBDoc(
        id="doc1",
        meta=MBDocMeta(title="T", author="Anson"),
        blocks=[
            HeadingBlock(id="b1", level=2, text="Greet"),
            ImageBlock(id="b2", src="/a.png"),
        ],
    )
    s = doc.model_dump_json()
    parsed = json.loads(s)
    assert parsed["id"] == "doc1"
    assert parsed["blocks"][0]["type"] == "heading"
    assert parsed["blocks"][1]["type"] == "image"
    # Roundtrip
    doc2 = MBDoc.model_validate(parsed)
    assert doc2.id == doc.id
    assert len(doc2.blocks) == 2


def test_mbdoc_discriminated_union_parsing():
    """Parsing raw JSON into MBDoc should pick the right Block subclass."""
    payload = {
        "id": "doc1",
        "version": "1",
        "meta": {"title": "T"},
        "blocks": [
            {"id": "b1", "type": "heading", "level": 1, "text": "H"},
            {"id": "b2", "type": "paragraph", "text": "P"},
            {"id": "b3", "type": "image", "src": "/a.png"},
        ],
    }
    doc = MBDoc.model_validate(payload)
    assert isinstance(doc.blocks[0], HeadingBlock)
    assert isinstance(doc.blocks[1], ParagraphBlock)
    assert isinstance(doc.blocks[2], ImageBlock)
```

- [ ] **Step 3: 运行测试确认失败**

Run:
```bash
cd D:/Web/MBEditor/backend
pytest tests/test_mbdoc_model.py -v
```
Expected: `ImportError` — `app.models.mbdoc` 不存在。

- [ ] **Step 4: 实现 MBDoc schema**

Create `backend/app/models/mbdoc.py`:
```python
"""
MBDoc — MBEditor Document block-based model.

MBDoc is the canonical document format for MBEditor. It replaces the flat
`{html, css, js, markdown}` article model with a block-list structure that
can mix HTML, Markdown, SVG, and rasterized blocks.

Every block has a `type` discriminator and its own shape. Renderers in
`app/services/renderers/` operate on individual blocks; the top-level
`render_for_wechat` function composes them into final content HTML.
"""
from enum import Enum
from typing import Annotated, List, Literal, Optional, Union

from pydantic import BaseModel, ConfigDict, Field, field_validator


class BlockType(str, Enum):
    HEADING = "heading"
    PARAGRAPH = "paragraph"
    MARKDOWN = "markdown"
    HTML = "html"
    IMAGE = "image"
    SVG = "svg"
    RASTER = "raster"


class _BlockBase(BaseModel):
    """Base class for all blocks. Not instantiated directly."""
    model_config = ConfigDict(extra="forbid")

    id: str = Field(..., min_length=1, max_length=64)


class HeadingBlock(_BlockBase):
    type: Literal[BlockType.HEADING] = BlockType.HEADING
    level: int = Field(..., ge=1, le=6)
    text: str = ""


class ParagraphBlock(_BlockBase):
    type: Literal[BlockType.PARAGRAPH] = BlockType.PARAGRAPH
    text: str = ""


class MarkdownBlock(_BlockBase):
    type: Literal[BlockType.MARKDOWN] = BlockType.MARKDOWN
    source: str = ""


class HtmlBlock(_BlockBase):
    type: Literal[BlockType.HTML] = BlockType.HTML
    source: str = ""
    css: str = ""  # optional per-block CSS that gets inlined into source


class ImageBlock(_BlockBase):
    type: Literal[BlockType.IMAGE] = BlockType.IMAGE
    src: str
    alt: str = ""
    width: Optional[int] = None
    height: Optional[int] = None


class SvgBlock(_BlockBase):
    type: Literal[BlockType.SVG] = BlockType.SVG
    source: str  # raw <svg>...</svg> string

    @field_validator("source")
    @classmethod
    def must_contain_svg_tag(cls, v: str) -> str:
        if "<svg" not in v.lower():
            raise ValueError("SVG block source must contain a <svg> element")
        return v


class RasterBlock(_BlockBase):
    """A block whose visual effect is delivered as a rasterized PNG.

    Use this for content that cannot be expressed in WeChat-compatible HTML
    or SVG: CSS Grid layouts, 3D transforms, animated backgrounds, etc.
    The Stage-5 rasterization worker will render (html + css) through
    headless Chromium into a PNG, upload it, and emit <img> in the final
    output.
    """
    type: Literal[BlockType.RASTER] = BlockType.RASTER
    html: str
    css: str = ""
    width: int = 750  # target viewport width for rasterization
    # Height is computed from the content by the renderer.


Block = Annotated[
    Union[
        HeadingBlock,
        ParagraphBlock,
        MarkdownBlock,
        HtmlBlock,
        ImageBlock,
        SvgBlock,
        RasterBlock,
    ],
    Field(discriminator="type"),
]


class MBDocMeta(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = ""
    author: str = ""
    digest: str = ""
    cover: str = ""


class MBDoc(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(..., min_length=1, max_length=64)
    version: Literal["1"] = "1"
    meta: MBDocMeta = Field(default_factory=MBDocMeta)
    blocks: List[Block] = Field(default_factory=list)
```

- [ ] **Step 5: 运行测试确认通过**

Run:
```bash
cd D:/Web/MBEditor/backend
pytest tests/test_mbdoc_model.py -v
```
Expected: all 11 tests PASS.

- [ ] **Step 6: 提交**

Run:
```bash
cd D:/Web/MBEditor
git add backend/app/models/__init__.py backend/app/models/mbdoc.py backend/tests/test_mbdoc_model.py
git commit -m "feat(mbdoc): add MBDoc Pydantic schema with 7 block types"
```

---

## Task 3: 实现 BlockRegistry + 基类 Renderer

**Files:**
- Create: `backend/app/services/renderers/__init__.py`
- Create: `backend/app/services/renderers/base.py`
- Create: `backend/app/services/renderers/stub.py`
- Create: `backend/app/services/block_registry.py`
- Create: `backend/tests/test_block_registry.py`

- [ ] **Step 1: 写失败的测试**

Create `backend/tests/test_block_registry.py`:
```python
"""Tests for BlockRegistry and renderer dispatch."""
import pytest

from app.models.mbdoc import (
    BlockType,
    HeadingBlock,
    ParagraphBlock,
    ImageBlock,
    MarkdownBlock,
    HtmlBlock,
    SvgBlock,
    RasterBlock,
)
from app.services.block_registry import (
    BlockRegistry,
    UnknownBlockTypeError,
    RenderContext,
)
from app.services.renderers.base import BlockRenderer
from app.services.renderers.stub import StubBlockRenderer


class _FakeRenderer(BlockRenderer):
    block_type = BlockType.HEADING

    def render(self, block, ctx):
        return f"<h{block.level}>{block.text}</h{block.level}>"


def test_registry_register_and_find():
    r = BlockRegistry()
    r.register(_FakeRenderer())
    result = r.find(BlockType.HEADING)
    assert isinstance(result, _FakeRenderer)


def test_registry_unknown_type_raises():
    r = BlockRegistry()
    with pytest.raises(UnknownBlockTypeError):
        r.find(BlockType.HEADING)


def test_registry_render_block():
    r = BlockRegistry()
    r.register(_FakeRenderer())
    block = HeadingBlock(id="h1", level=2, text="Greet")
    ctx = RenderContext(upload_images=False)
    out = r.render_block(block, ctx)
    assert out == "<h2>Greet</h2>"


def test_stub_renderer_returns_warning_markup():
    stub = StubBlockRenderer(BlockType.SVG)
    block = SvgBlock(id="s1", source="<svg></svg>")
    ctx = RenderContext(upload_images=False)
    out = stub.render(block, ctx)
    # Stub output must be visible so devs notice missing renderers.
    assert "stub" in out.lower() or "not implemented" in out.lower()
    assert block.id in out


def test_render_context_defaults():
    ctx = RenderContext()
    assert ctx.upload_images is False
    assert ctx.image_uploader is None
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd D:/Web/MBEditor/backend && pytest tests/test_block_registry.py -v`
Expected: `ImportError`.

- [ ] **Step 3: 实现 RenderContext + base renderer**

Create `backend/app/services/renderers/__init__.py` as empty file.

Create `backend/app/services/renderers/base.py`:
```python
"""BlockRenderer abstract base class."""
from abc import ABC, abstractmethod
from typing import TYPE_CHECKING

from app.models.mbdoc import BlockType

if TYPE_CHECKING:
    from app.models.mbdoc import Block
    from app.services.block_registry import RenderContext


class BlockRenderer(ABC):
    """Base class for all block renderers.

    Subclasses must:
    - Set class attribute `block_type` to the BlockType they handle
    - Implement `render(block, ctx) -> str` returning the final HTML fragment
      for that block

    The returned HTML is inserted directly into the concatenated document
    output by `render_for_wechat`. It MUST already be inline-styled and
    WeChat-compatible — no class attributes, no <style> tags, no <script>.
    """

    block_type: BlockType

    @abstractmethod
    def render(self, block: "Block", ctx: "RenderContext") -> str:
        raise NotImplementedError
```

- [ ] **Step 4: 实现 stub renderer**

Create `backend/app/services/renderers/stub.py`:
```python
"""StubBlockRenderer — placeholder for block types not yet implemented."""
from html import escape

from app.models.mbdoc import Block, BlockType
from app.services.renderers.base import BlockRenderer


class StubBlockRenderer(BlockRenderer):
    """Renderer that emits a highly visible warning block.

    Used in Stage 1 for block types whose real renderer lands in later
    stages (Stage 2 for html/markdown, Stage 3 for image, Stage 4 for svg,
    Stage 5 for raster).

    The output is inline-styled so it shows up even in production-like
    preview contexts.
    """

    def __init__(self, block_type: BlockType):
        self.block_type = block_type

    def render(self, block: Block, ctx) -> str:
        return (
            '<section style="margin:16px 0;padding:12px 16px;'
            'background:#fff3cd;border:2px solid #e8784a;'
            'border-radius:8px;color:#664d03;font-family:monospace;'
            'font-size:13px;">'
            f"[stub renderer — block type <b>{escape(str(self.block_type.value))}</b> "
            f"(id={escape(block.id)}) not implemented yet]"
            "</section>"
        )
```

- [ ] **Step 5: 实现 BlockRegistry**

Create `backend/app/services/block_registry.py`:
```python
"""BlockRegistry — routes blocks to their registered renderers."""
from dataclasses import dataclass, field
from typing import Callable, Dict, Optional

from app.models.mbdoc import Block, BlockType
from app.services.renderers.base import BlockRenderer


class UnknownBlockTypeError(Exception):
    """Raised when no renderer is registered for a given BlockType."""

    def __init__(self, block_type: BlockType):
        self.block_type = block_type
        super().__init__(
            f"No renderer registered for block type {block_type.value!r}. "
            f"Did you forget to register it in BlockRegistry.default()?"
        )


ImageUploader = Callable[[bytes, str], str]
"""Callable that uploads image bytes and returns a public URL.
Signature: (image_bytes, filename) -> url
Used by renderers to swap local/external URLs with WeChat CDN URLs when
`ctx.upload_images = True`.
"""


@dataclass
class RenderContext:
    """Context passed to every block renderer.

    Attributes:
        upload_images: when True, renderers should replace local/external
            image src with uploaded CDN URLs (via image_uploader). When
            False, renderers leave src unchanged.
        image_uploader: optional callable; required when upload_images=True.
        per_block_metadata: scratchpad for renderers to share info (e.g.
            markdown renderer records extracted images for the next block
            to reuse).
    """
    upload_images: bool = False
    image_uploader: Optional[ImageUploader] = None
    per_block_metadata: Dict[str, object] = field(default_factory=dict)


class BlockRegistry:
    """Maps BlockType → BlockRenderer and dispatches render calls."""

    def __init__(self) -> None:
        self._renderers: Dict[BlockType, BlockRenderer] = {}

    def register(self, renderer: BlockRenderer) -> None:
        self._renderers[renderer.block_type] = renderer

    def find(self, block_type: BlockType) -> BlockRenderer:
        r = self._renderers.get(block_type)
        if r is None:
            raise UnknownBlockTypeError(block_type)
        return r

    def render_block(self, block: Block, ctx: RenderContext) -> str:
        renderer = self.find(block.type)
        return renderer.render(block, ctx)

    @classmethod
    def default(cls) -> "BlockRegistry":
        """Return a registry with all 7 block types registered.

        Stage 1: all renderers are StubBlockRenderer except HeadingBlock
        and ParagraphBlock, which have minimal working implementations
        (see heading_paragraph.py). Stage 2-5 replace the stubs with real
        renderers by updating this method.
        """
        from app.services.renderers.heading_paragraph import (
            HeadingRenderer,
            ParagraphRenderer,
        )
        from app.services.renderers.stub import StubBlockRenderer

        registry = cls()
        registry.register(HeadingRenderer())
        registry.register(ParagraphRenderer())
        registry.register(StubBlockRenderer(BlockType.MARKDOWN))
        registry.register(StubBlockRenderer(BlockType.HTML))
        registry.register(StubBlockRenderer(BlockType.IMAGE))
        registry.register(StubBlockRenderer(BlockType.SVG))
        registry.register(StubBlockRenderer(BlockType.RASTER))
        return registry
```

- [ ] **Step 6: 运行测试确认前 4 个通过**

Run: `cd D:/Web/MBEditor/backend && pytest tests/test_block_registry.py -v`
Expected: tests 1-4 PASS, test 5 may still fail if the test imports are ok.

（`test_render_context_defaults` 也应该 PASS，因为 `RenderContext` 的默认值已经在 base.py 里定义）

- [ ] **Step 7: 提交**

Run:
```bash
cd D:/Web/MBEditor
git add backend/app/services/renderers/__init__.py backend/app/services/renderers/base.py backend/app/services/renderers/stub.py backend/app/services/block_registry.py backend/tests/test_block_registry.py
git commit -m "feat(block-registry): add BlockRegistry with stub renderers and RenderContext"
```

---

## Task 4: 实现最小可用的 Heading/Paragraph Renderer

**Files:**
- Create: `backend/app/services/renderers/heading_paragraph.py`
- Create: `backend/tests/test_heading_paragraph_renderer.py`

- [ ] **Step 1: 写失败的测试**

Create `backend/tests/test_heading_paragraph_renderer.py`:
```python
"""Tests for the minimal HeadingRenderer and ParagraphRenderer."""
from app.models.mbdoc import HeadingBlock, ParagraphBlock
from app.services.block_registry import RenderContext
from app.services.renderers.heading_paragraph import (
    HeadingRenderer,
    ParagraphRenderer,
)


def test_heading_renders_h1_to_h6():
    r = HeadingRenderer()
    ctx = RenderContext()
    for level in range(1, 7):
        block = HeadingBlock(id=f"h{level}", level=level, text=f"T{level}")
        out = r.render(block, ctx)
        assert f"<h{level}" in out
        assert f"</h{level}>" in out
        assert f"T{level}" in out


def test_heading_has_inline_style():
    r = HeadingRenderer()
    block = HeadingBlock(id="h1", level=1, text="Hello")
    out = r.render(block, RenderContext())
    assert 'style="' in out
    assert "font-size" in out.lower() or "font-weight" in out.lower()


def test_heading_no_class_no_style_tag():
    """Output must be WeChat-compatible: no class, no <style>, no <script>."""
    r = HeadingRenderer()
    block = HeadingBlock(id="h1", level=2, text="Greet")
    out = r.render(block, RenderContext())
    assert "class=" not in out
    assert "<style" not in out
    assert "<script" not in out


def test_heading_escapes_html():
    r = HeadingRenderer()
    block = HeadingBlock(id="h1", level=1, text="<script>alert(1)</script>")
    out = r.render(block, RenderContext())
    assert "<script>alert" not in out
    assert "&lt;script&gt;" in out


def test_paragraph_renders_p():
    r = ParagraphRenderer()
    block = ParagraphBlock(id="p1", text="Body text.")
    out = r.render(block, RenderContext())
    assert "<p" in out
    assert "</p>" in out
    assert "Body text." in out


def test_paragraph_has_inline_style():
    r = ParagraphRenderer()
    block = ParagraphBlock(id="p1", text="Body.")
    out = r.render(block, RenderContext())
    assert 'style="' in out
    assert "line-height" in out.lower()


def test_paragraph_escapes_html():
    r = ParagraphRenderer()
    block = ParagraphBlock(id="p1", text="<b>not bold</b>")
    out = r.render(block, RenderContext())
    assert "<b>not bold</b>" not in out
    assert "&lt;b&gt;" in out
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd D:/Web/MBEditor/backend && pytest tests/test_heading_paragraph_renderer.py -v`
Expected: `ImportError`.

- [ ] **Step 3: 实现 renderer**

Create `backend/app/services/renderers/heading_paragraph.py`:
```python
"""Minimal HeadingRenderer and ParagraphRenderer for Stage 1.

These are plain-text renderers — they take block.text and wrap it in the
appropriate HTML tag with an inline style. They are sufficient for the
Stage-1 end-to-end API test and will remain unchanged through Stage 2-5
(since those stages add other block types, not change these two).

Styles are minimal and matched to the Stage-0 WechatPreview iframe chrome
so preview ≡ content.
"""
from html import escape

from app.models.mbdoc import Block, BlockType, HeadingBlock, ParagraphBlock
from app.services.block_registry import RenderContext
from app.services.renderers.base import BlockRenderer


_HEADING_STYLES = {
    1: "font-size:26px;font-weight:700;line-height:1.4;margin:24px 0 16px;color:#222;",
    2: "font-size:22px;font-weight:700;line-height:1.4;margin:20px 0 14px;color:#222;",
    3: "font-size:19px;font-weight:700;line-height:1.4;margin:18px 0 12px;color:#222;",
    4: "font-size:17px;font-weight:700;line-height:1.4;margin:16px 0 10px;color:#222;",
    5: "font-size:16px;font-weight:700;line-height:1.4;margin:14px 0 8px;color:#333;",
    6: "font-size:15px;font-weight:700;line-height:1.4;margin:12px 0 6px;color:#555;",
}


_PARAGRAPH_STYLE = "font-size:16px;line-height:1.8;margin:12px 0;color:#333;"


class HeadingRenderer(BlockRenderer):
    block_type = BlockType.HEADING

    def render(self, block: Block, ctx: RenderContext) -> str:
        assert isinstance(block, HeadingBlock)
        style = _HEADING_STYLES[block.level]
        text = escape(block.text)
        return f'<h{block.level} style="{style}">{text}</h{block.level}>'


class ParagraphRenderer(BlockRenderer):
    block_type = BlockType.PARAGRAPH

    def render(self, block: Block, ctx: RenderContext) -> str:
        assert isinstance(block, ParagraphBlock)
        text = escape(block.text)
        return f'<p style="{_PARAGRAPH_STYLE}">{text}</p>'
```

- [ ] **Step 4: 运行测试确认全部通过**

Run: `cd D:/Web/MBEditor/backend && pytest tests/test_heading_paragraph_renderer.py tests/test_block_registry.py -v`
Expected: all tests PASS.

- [ ] **Step 5: 提交**

Run:
```bash
cd D:/Web/MBEditor
git add backend/app/services/renderers/heading_paragraph.py backend/tests/test_heading_paragraph_renderer.py
git commit -m "feat(renderers): add minimal Heading/Paragraph renderers with inline styles"
```

---

## Task 5: 实现 render_for_wechat 主入口

**Files:**
- Create: `backend/app/services/render_for_wechat.py`
- Create: `backend/tests/test_render_for_wechat.py`

- [ ] **Step 1: 写失败的测试**

Create `backend/tests/test_render_for_wechat.py`:
```python
"""Tests for the top-level render_for_wechat function."""
from app.models.mbdoc import (
    MBDoc,
    MBDocMeta,
    HeadingBlock,
    ParagraphBlock,
    ImageBlock,
)
from app.services.block_registry import BlockRegistry, RenderContext
from app.services.render_for_wechat import render_for_wechat


def _sample_doc() -> MBDoc:
    return MBDoc(
        id="d1",
        meta=MBDocMeta(title="Demo"),
        blocks=[
            HeadingBlock(id="h1", level=1, text="Welcome"),
            ParagraphBlock(id="p1", text="Hello, WeChat."),
            HeadingBlock(id="h2", level=2, text="Details"),
            ParagraphBlock(id="p2", text="More text."),
        ],
    )


def test_render_for_wechat_concatenates_blocks():
    doc = _sample_doc()
    ctx = RenderContext(upload_images=False)
    html = render_for_wechat(doc, ctx)
    assert "Welcome" in html
    assert "Hello, WeChat." in html
    assert "Details" in html
    assert "<h1" in html
    assert "<h2" in html
    assert "<p" in html


def test_render_for_wechat_no_forbidden_tags():
    doc = _sample_doc()
    html = render_for_wechat(doc, RenderContext())
    assert "<style" not in html
    assert "<script" not in html
    assert "<link" not in html
    assert "class=" not in html


def test_render_for_wechat_two_calls_identical_for_text_blocks():
    """With only text blocks, upload_images=True/False must yield identical HTML.

    This is the core WYSIWYG invariant: the diff between the two modes must
    be confined to <img src> attributes (tested in the image-block test).
    """
    doc = _sample_doc()
    a = render_for_wechat(doc, RenderContext(upload_images=False))
    b = render_for_wechat(doc, RenderContext(
        upload_images=True,
        image_uploader=lambda data, name: f"https://mmbiz.qpic.cn/{name}",
    ))
    assert a == b


def test_render_for_wechat_stub_block_shows_warning():
    """A block whose renderer is a stub should produce visible warning markup."""
    from app.models.mbdoc import SvgBlock
    doc = MBDoc(
        id="d1",
        meta=MBDocMeta(title="T"),
        blocks=[
            HeadingBlock(id="h1", level=1, text="Title"),
            SvgBlock(id="s1", source="<svg></svg>"),
        ],
    )
    html = render_for_wechat(doc, RenderContext())
    assert "stub" in html.lower()
    assert "s1" in html


def test_render_for_wechat_empty_doc():
    doc = MBDoc(id="d1", meta=MBDocMeta(title="T"), blocks=[])
    html = render_for_wechat(doc, RenderContext())
    # Empty doc renders to an empty string (or just whitespace)
    assert html.strip() == ""
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd D:/Web/MBEditor/backend && pytest tests/test_render_for_wechat.py -v`
Expected: `ImportError`.

- [ ] **Step 3: 实现 render_for_wechat**

Create `backend/app/services/render_for_wechat.py`:
```python
"""
render_for_wechat — the single canonical rendering entry point.

This function is the SINGLE source of truth for converting an MBDoc into
WeChat-compatible HTML. Preview iframe, "copy rich text", and "push to
draft" all call this function. The diff between `upload_images=False` and
`upload_images=True` calls MUST be confined to `<img src>` attributes;
this invariant is verified by tests in `tests/test_render_for_wechat.py`.

Stage 1 only uses the minimal Heading/Paragraph renderers plus stubs for
the remaining block types. Stage 2-5 replace stubs with real renderers by
updating `BlockRegistry.default()`; this function does not change.
"""
from app.models.mbdoc import MBDoc
from app.services.block_registry import BlockRegistry, RenderContext


def render_for_wechat(
    doc: MBDoc,
    ctx: RenderContext,
    *,
    registry: BlockRegistry | None = None,
) -> str:
    """Render a full MBDoc into a single HTML string.

    Args:
        doc: the source document.
        ctx: rendering context (upload_images flag, image uploader, etc.).
        registry: optional custom registry (default: BlockRegistry.default()).

    Returns:
        A concatenated HTML string ready to be:
        - written into the preview iframe body (if ctx.upload_images=False)
        - copied to the clipboard (if ctx.upload_images=True and uploader set)
        - sent to the WeChat draft/add content field (same as above)

    The returned HTML is guaranteed to:
    - Contain no <style>, <script>, <link>, or class attributes
    - Have inline styles on every semantically styled element
    - Produce byte-identical output for two calls with the same doc and
      same ctx.upload_images value
    """
    reg = registry or BlockRegistry.default()
    pieces: list[str] = []
    for block in doc.blocks:
        pieces.append(reg.render_block(block, ctx))
    return "\n".join(pieces)
```

- [ ] **Step 4: 运行测试确认全部通过**

Run: `cd D:/Web/MBEditor/backend && pytest tests/test_render_for_wechat.py -v`
Expected: all 5 tests PASS.

- [ ] **Step 5: 跑完整后端测试**

Run: `cd D:/Web/MBEditor/backend && pytest -v`
Expected: all tests pass.

- [ ] **Step 6: 提交**

Run:
```bash
cd D:/Web/MBEditor
git add backend/app/services/render_for_wechat.py backend/tests/test_render_for_wechat.py
git commit -m "feat(render): add render_for_wechat single entry point"
```

---

## Task 6: 实现 MBDoc 文件存储

**Files:**
- Create: `backend/app/services/mbdoc_storage.py`
- Create: `backend/tests/test_mbdoc_storage.py`

- [ ] **Step 1: 写失败的测试**

Create `backend/tests/test_mbdoc_storage.py`:
```python
"""Tests for MBDoc file-based storage."""
import json
import pytest
from pathlib import Path

from app.models.mbdoc import MBDoc, MBDocMeta, HeadingBlock
from app.services.mbdoc_storage import MBDocStorage, MBDocNotFoundError


@pytest.fixture
def storage(tmp_path: Path) -> MBDocStorage:
    return MBDocStorage(base_dir=tmp_path / "mbdocs")


def test_create_and_get(storage: MBDocStorage):
    doc = MBDoc(
        id="d1",
        meta=MBDocMeta(title="T"),
        blocks=[HeadingBlock(id="h1", level=1, text="H")],
    )
    storage.save(doc)
    loaded = storage.get("d1")
    assert loaded.id == "d1"
    assert loaded.meta.title == "T"
    assert len(loaded.blocks) == 1


def test_get_missing_raises(storage: MBDocStorage):
    with pytest.raises(MBDocNotFoundError):
        storage.get("nonexistent")


def test_update_overwrites(storage: MBDocStorage):
    doc1 = MBDoc(id="d1", meta=MBDocMeta(title="v1"))
    storage.save(doc1)
    doc2 = MBDoc(id="d1", meta=MBDocMeta(title="v2"))
    storage.save(doc2)
    loaded = storage.get("d1")
    assert loaded.meta.title == "v2"


def test_delete(storage: MBDocStorage):
    doc = MBDoc(id="d1", meta=MBDocMeta(title="T"))
    storage.save(doc)
    storage.delete("d1")
    with pytest.raises(MBDocNotFoundError):
        storage.get("d1")


def test_delete_missing_raises(storage: MBDocStorage):
    with pytest.raises(MBDocNotFoundError):
        storage.delete("nonexistent")


def test_list_ids_empty(storage: MBDocStorage):
    assert storage.list_ids() == []


def test_list_ids(storage: MBDocStorage):
    storage.save(MBDoc(id="a", meta=MBDocMeta(title="A")))
    storage.save(MBDoc(id="b", meta=MBDocMeta(title="B")))
    assert sorted(storage.list_ids()) == ["a", "b"]


def test_storage_creates_directory(tmp_path: Path):
    target = tmp_path / "nested" / "mbdocs"
    assert not target.exists()
    storage = MBDocStorage(base_dir=target)
    storage.save(MBDoc(id="x", meta=MBDocMeta(title="X")))
    assert target.is_dir()


def test_stored_file_is_valid_json(storage: MBDocStorage):
    doc = MBDoc(id="d1", meta=MBDocMeta(title="T"))
    storage.save(doc)
    path = storage._path_for("d1")
    data = json.loads(path.read_text(encoding="utf-8"))
    assert data["id"] == "d1"
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd D:/Web/MBEditor/backend && pytest tests/test_mbdoc_storage.py -v`
Expected: `ImportError`.

- [ ] **Step 3: 实现 storage**

Create `backend/app/services/mbdoc_storage.py`:
```python
"""MBDoc file-based storage.

MBDocs are persisted as individual JSON files under `data/mbdocs/`. This
mirrors the pattern used by the existing `article_service` for the legacy
article model — no database dependency, easy to inspect/backup.
"""
from pathlib import Path
from typing import List

from app.core.config import settings
from app.models.mbdoc import MBDoc


class MBDocNotFoundError(Exception):
    def __init__(self, mbdoc_id: str):
        self.mbdoc_id = mbdoc_id
        super().__init__(f"MBDoc not found: {mbdoc_id!r}")


class MBDocStorage:
    def __init__(self, base_dir: Path | None = None):
        if base_dir is None:
            base_dir = Path(settings.DATA_DIR) / "mbdocs"
        self.base_dir = Path(base_dir)

    def _path_for(self, mbdoc_id: str) -> Path:
        return self.base_dir / f"{mbdoc_id}.json"

    def _ensure_dir(self) -> None:
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def save(self, doc: MBDoc) -> None:
        self._ensure_dir()
        path = self._path_for(doc.id)
        path.write_text(doc.model_dump_json(indent=2), encoding="utf-8")

    def get(self, mbdoc_id: str) -> MBDoc:
        path = self._path_for(mbdoc_id)
        if not path.exists():
            raise MBDocNotFoundError(mbdoc_id)
        return MBDoc.model_validate_json(path.read_text(encoding="utf-8"))

    def delete(self, mbdoc_id: str) -> None:
        path = self._path_for(mbdoc_id)
        if not path.exists():
            raise MBDocNotFoundError(mbdoc_id)
        path.unlink()

    def list_ids(self) -> List[str]:
        if not self.base_dir.exists():
            return []
        return [p.stem for p in self.base_dir.glob("*.json")]
```

- [ ] **Step 4: 检查 settings.DATA_DIR 是否存在**

Run: `grep -n "DATA_DIR" D:/Web/MBEditor/backend/app/core/config.py`

If `DATA_DIR` is not defined, edit `backend/app/core/config.py` and add to the `Settings` class:
```python
DATA_DIR: str = "/app/data"
```
(Use whatever path convention matches existing settings. If there's `IMAGES_DIR = "/app/data/images"`, then `DATA_DIR = "/app/data"` is the parent.)

- [ ] **Step 5: 运行 storage 测试**

Run: `cd D:/Web/MBEditor/backend && pytest tests/test_mbdoc_storage.py -v`
Expected: all 9 tests PASS.

- [ ] **Step 6: 提交**

Run:
```bash
cd D:/Web/MBEditor
git add backend/app/services/mbdoc_storage.py backend/tests/test_mbdoc_storage.py backend/app/core/config.py 2>/dev/null
git commit -m "feat(mbdoc): add file-based MBDocStorage"
```

---

## Task 7: 实现 /api/v1/mbdoc 路由

**Files:**
- Create: `backend/app/api/v1/mbdoc.py`
- Modify: `backend/app/api/v1/router.py`
- Create: `backend/tests/test_mbdoc_api.py`

- [ ] **Step 1: 写失败的 API 测试**

Create `backend/tests/test_mbdoc_api.py`:
```python
"""End-to-end tests for /api/v1/mbdoc endpoints."""
import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client(tmp_path, monkeypatch) -> TestClient:
    # Redirect storage to a tmp dir to avoid polluting /app/data.
    from app.services import mbdoc_storage
    monkeypatch.setattr(
        mbdoc_storage,
        "MBDocStorage",
        lambda base_dir=None: mbdoc_storage.MBDocStorage.__new__(
            mbdoc_storage.MBDocStorage
        ).__init__(base_dir=tmp_path / "mbdocs") or mbdoc_storage.MBDocStorage(
            base_dir=tmp_path / "mbdocs"
        ),
    )
    return TestClient(app)


def _sample_payload() -> dict:
    return {
        "id": "doc-test-1",
        "version": "1",
        "meta": {"title": "Test Doc", "author": "Anson"},
        "blocks": [
            {"id": "h1", "type": "heading", "level": 1, "text": "Hello"},
            {"id": "p1", "type": "paragraph", "text": "World"},
        ],
    }


def test_create_mbdoc(client: TestClient):
    resp = client.post("/api/v1/mbdoc", json=_sample_payload())
    assert resp.status_code == 200
    body = resp.json()
    assert body["code"] == 0
    assert body["data"]["id"] == "doc-test-1"


def test_get_mbdoc(client: TestClient):
    client.post("/api/v1/mbdoc", json=_sample_payload())
    resp = client.get("/api/v1/mbdoc/doc-test-1")
    assert resp.status_code == 200
    body = resp.json()
    assert body["code"] == 0
    assert body["data"]["meta"]["title"] == "Test Doc"
    assert len(body["data"]["blocks"]) == 2


def test_get_missing_mbdoc_returns_404(client: TestClient):
    resp = client.get("/api/v1/mbdoc/nonexistent")
    assert resp.status_code == 404


def test_update_mbdoc(client: TestClient):
    client.post("/api/v1/mbdoc", json=_sample_payload())
    updated = _sample_payload()
    updated["meta"]["title"] = "Updated Title"
    resp = client.put("/api/v1/mbdoc/doc-test-1", json=updated)
    assert resp.status_code == 200

    resp = client.get("/api/v1/mbdoc/doc-test-1")
    assert resp.json()["data"]["meta"]["title"] == "Updated Title"


def test_delete_mbdoc(client: TestClient):
    client.post("/api/v1/mbdoc", json=_sample_payload())
    resp = client.delete("/api/v1/mbdoc/doc-test-1")
    assert resp.status_code == 200

    resp = client.get("/api/v1/mbdoc/doc-test-1")
    assert resp.status_code == 404


def test_list_mbdocs(client: TestClient):
    client.post("/api/v1/mbdoc", json=_sample_payload())

    p2 = _sample_payload()
    p2["id"] = "doc-test-2"
    client.post("/api/v1/mbdoc", json=p2)

    resp = client.get("/api/v1/mbdoc")
    assert resp.status_code == 200
    ids = {item["id"] for item in resp.json()["data"]}
    assert "doc-test-1" in ids
    assert "doc-test-2" in ids


def test_render_mbdoc_preview_mode(client: TestClient):
    client.post("/api/v1/mbdoc", json=_sample_payload())
    resp = client.post(
        "/api/v1/mbdoc/doc-test-1/render?upload_images=false"
    )
    assert resp.status_code == 200
    html = resp.json()["data"]["html"]
    assert "<h1" in html
    assert "Hello" in html
    assert "World" in html
    assert "<p" in html


def test_render_mbdoc_preview_and_upload_equal_for_text_only(client: TestClient):
    """WYSIWYG invariant: for text-only docs, preview and upload modes
    produce identical HTML."""
    client.post("/api/v1/mbdoc", json=_sample_payload())
    a = client.post(
        "/api/v1/mbdoc/doc-test-1/render?upload_images=false"
    ).json()["data"]["html"]
    b = client.post(
        "/api/v1/mbdoc/doc-test-1/render?upload_images=true"
    ).json()["data"]["html"]
    assert a == b


def test_create_mbdoc_validation_error(client: TestClient):
    """Invalid payload returns 422."""
    bad = {"id": "x", "blocks": [{"id": "b", "type": "heading", "level": 99}]}
    resp = client.post("/api/v1/mbdoc", json=bad)
    assert resp.status_code == 422
```

- [ ] **Step 2: 简化 fixture**

The fixture in Step 1 uses a clever monkeypatch that's hard to get right. Replace the fixture with a simpler approach:

Edit `backend/tests/test_mbdoc_api.py`, replace the `client` fixture with:
```python
@pytest.fixture(autouse=True)
def _isolate_storage(tmp_path, monkeypatch):
    """Make every test use its own temp mbdoc directory."""
    import app.services.mbdoc_storage as storage_mod
    original_init = storage_mod.MBDocStorage.__init__

    def patched_init(self, base_dir=None):
        original_init(self, base_dir=tmp_path / "mbdocs")

    monkeypatch.setattr(
        storage_mod.MBDocStorage, "__init__", patched_init
    )
    yield


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)
```

- [ ] **Step 3: 运行测试确认失败**

Run: `cd D:/Web/MBEditor/backend && pytest tests/test_mbdoc_api.py -v`
Expected: 404s (endpoints not yet registered).

- [ ] **Step 4: 实现路由**

Create `backend/app/api/v1/mbdoc.py`:
```python
"""REST API for MBDoc CRUD + rendering."""
from typing import List

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.core.response import success
from app.models.mbdoc import MBDoc
from app.services.block_registry import BlockRegistry, RenderContext
from app.services.mbdoc_storage import MBDocNotFoundError, MBDocStorage
from app.services.render_for_wechat import render_for_wechat


router = APIRouter(prefix="/mbdoc", tags=["mbdoc"])


def _storage() -> MBDocStorage:
    return MBDocStorage()


class MBDocSummary(BaseModel):
    id: str
    title: str


@router.post("")
async def create_mbdoc(doc: MBDoc):
    """Create or replace an MBDoc. Idempotent by id."""
    _storage().save(doc)
    return success(doc.model_dump())


@router.get("")
async def list_mbdocs():
    storage = _storage()
    ids = storage.list_ids()
    summaries: List[dict] = []
    for mid in ids:
        try:
            d = storage.get(mid)
            summaries.append({"id": d.id, "title": d.meta.title})
        except MBDocNotFoundError:
            continue
    return success(summaries)


@router.get("/{mbdoc_id}")
async def get_mbdoc(mbdoc_id: str):
    try:
        doc = _storage().get(mbdoc_id)
    except MBDocNotFoundError:
        raise HTTPException(status_code=404, detail=f"MBDoc not found: {mbdoc_id}")
    return success(doc.model_dump())


@router.put("/{mbdoc_id}")
async def update_mbdoc(mbdoc_id: str, doc: MBDoc):
    if doc.id != mbdoc_id:
        raise HTTPException(
            status_code=400,
            detail=f"MBDoc id mismatch: path={mbdoc_id} body={doc.id}",
        )
    _storage().save(doc)
    return success(doc.model_dump())


@router.delete("/{mbdoc_id}")
async def delete_mbdoc(mbdoc_id: str):
    try:
        _storage().delete(mbdoc_id)
    except MBDocNotFoundError:
        raise HTTPException(status_code=404, detail=f"MBDoc not found: {mbdoc_id}")
    return success({"id": mbdoc_id})


@router.post("/{mbdoc_id}/render")
async def render_mbdoc(
    mbdoc_id: str,
    upload_images: bool = Query(
        default=False,
        description="When true, renderers should swap image src to WeChat CDN URLs.",
    ),
):
    """Render an MBDoc to final HTML.

    Stage 1: upload_images is accepted but no real uploader is wired yet.
    Text-only docs will yield identical HTML for both values. Stage 3 adds
    the real uploader for image blocks.
    """
    try:
        doc = _storage().get(mbdoc_id)
    except MBDocNotFoundError:
        raise HTTPException(status_code=404, detail=f"MBDoc not found: {mbdoc_id}")

    ctx = RenderContext(upload_images=upload_images, image_uploader=None)
    html = render_for_wechat(doc, ctx)
    return success({"html": html, "uploaded_images": upload_images})
```

- [ ] **Step 5: 注册路由**

Edit `backend/app/api/v1/router.py`. First read it to see the existing pattern:

Run: `cat D:/Web/MBEditor/backend/app/api/v1/router.py`

Then add the mbdoc router registration. The file likely looks something like:
```python
from fastapi import APIRouter
from app.api.v1 import articles, images, publish, wechat

router = APIRouter(prefix="/api/v1")
router.include_router(articles.router)
router.include_router(images.router)
router.include_router(publish.router)
router.include_router(wechat.router)
```

Add the mbdoc import and include:
```python
from app.api.v1 import articles, images, publish, wechat, mbdoc
# ...
router.include_router(mbdoc.router)
```

- [ ] **Step 6: 运行 API 测试**

Run: `cd D:/Web/MBEditor/backend && pytest tests/test_mbdoc_api.py -v`
Expected: all 9 tests PASS.

- [ ] **Step 7: 跑全部后端测试**

Run: `cd D:/Web/MBEditor/backend && pytest -v`
Expected: all tests pass.

- [ ] **Step 8: 冒烟验证旧端点仍可用**

Run:
```bash
cd D:/Web/MBEditor/backend
uvicorn app.main:app --port 7072 &
sleep 3
curl -s http://localhost:7072/api/v1/articles | head -c 200
curl -s http://localhost:7072/api/v1/mbdoc | head -c 200
kill %1 2>/dev/null || true
```
Expected: `/articles` 返回 `{"code":0,...}`; `/mbdoc` 返回 `{"code":0,"data":[]}`.

- [ ] **Step 9: 提交**

Run:
```bash
cd D:/Web/MBEditor
git add backend/app/api/v1/mbdoc.py backend/app/api/v1/router.py backend/tests/test_mbdoc_api.py
git commit -m "feat(api): add /api/v1/mbdoc CRUD + render endpoints"
```

---

## Task 8: 更新 skill 添加 MBDoc 章节

**Files:**
- Modify: `skill/mbeditor.skill.md`

- [ ] **Step 1: 在"写作指南"章节警告横幅之后，新增 MBDoc 章节**

Edit `skill/mbeditor.skill.md`. 找到 Stage 0 加的警告横幅：
```markdown
> ⚠️ **即将变更（2026-04）：** 当前 skill 描述的是 `/articles` legacy API...
```

在这个横幅**之后**立即插入新章节：
```markdown

---

## MBDoc 文档模型（推荐用法，Stage 1 起可用）

MBDoc 是 MBEditor 的**新一代文档格式**，是 Block 化的 JSON 结构。AI Agent 推荐直接产出 MBDoc JSON 并发送，跳过"自己写 HTML 字符串"的陷阱。

### Schema

```json
{
  "id": "doc-20260411-001",
  "version": "1",
  "meta": {
    "title": "文章标题",
    "author": "作者名",
    "digest": "一句话摘要",
    "cover": "/images/cover.jpg"
  },
  "blocks": [
    { "id": "b1", "type": "heading", "level": 1, "text": "主标题" },
    { "id": "b2", "type": "paragraph", "text": "正文段落。" }
  ]
}
```

### 当前可用的 block 类型（Stage 1）

| type | 状态 | 必填字段 |
|---|---|---|
| `heading` | ✅ 可用 | `level` (1-6), `text` |
| `paragraph` | ✅ 可用 | `text` |
| `markdown` | 🚧 stub（Stage 2 实装） | `source` |
| `html` | 🚧 stub（Stage 2 实装） | `source` |
| `image` | 🚧 stub（Stage 3 实装） | `src` |
| `svg` | 🚧 stub（Stage 4 实装） | `source` (必须含 `<svg>` 标签) |
| `raster` | 🚧 stub（Stage 5 实装） | `html`, `css` |

**stub 状态**：这些 block 会被渲染为醒目的黄色警告框，提醒你该类型尚未实装。Stage 2-5 会依次替换。

### API 端点

#### 1. 创建 MBDoc
```bash
curl -X POST http://localhost:7072/api/v1/mbdoc \
  -H "Content-Type: application/json" \
  -d '{
    "id": "doc-20260411-001",
    "version": "1",
    "meta": {"title": "Hello MBDoc", "author": "Anson"},
    "blocks": [
      {"id": "h1", "type": "heading", "level": 1, "text": "欢迎"},
      {"id": "p1", "type": "paragraph", "text": "这是第一个 MBDoc 文档。"}
    ]
  }'
```

#### 2. 获取 MBDoc
```bash
curl http://localhost:7072/api/v1/mbdoc/doc-20260411-001
```

#### 3. 更新 MBDoc
```bash
curl -X PUT http://localhost:7072/api/v1/mbdoc/doc-20260411-001 \
  -H "Content-Type: application/json" \
  -d '{ ... 完整 MBDoc JSON ... }'
```

注意：PUT 必须传完整对象，`id` 字段必须与 URL 一致。

#### 4. 列出所有 MBDoc
```bash
curl http://localhost:7072/api/v1/mbdoc
```
返回 `[{"id": "...", "title": "..."}, ...]`

#### 5. 渲染为 HTML（预览模式）
```bash
curl -X POST "http://localhost:7072/api/v1/mbdoc/doc-20260411-001/render?upload_images=false"
```
返回：`{"code":0,"data":{"html":"<h1 style=\"...\">欢迎</h1>\n<p style=\"...\">...</p>", "uploaded_images": false}}`

#### 6. 渲染为 HTML（发布模式 — Stage 3 起真正上传图片）
```bash
curl -X POST "http://localhost:7072/api/v1/mbdoc/doc-20260411-001/render?upload_images=true"
```

#### 7. 删除 MBDoc
```bash
curl -X DELETE http://localhost:7072/api/v1/mbdoc/doc-20260411-001
```

### Agent 工作流示例

```bash
# 1. 构建 MBDoc JSON（可直接在脚本里）
cat > /tmp/doc.json <<'EOF'
{
  "id": "demo-001",
  "version": "1",
  "meta": {"title": "AI 生成的文章", "author": "Claude"},
  "blocks": [
    {"id": "h1", "type": "heading", "level": 1, "text": "AI 如何改变写作"},
    {"id": "p1", "type": "paragraph", "text": "人工智能正在重塑内容生产方式..."},
    {"id": "h2", "type": "heading", "level": 2, "text": "关键变化"},
    {"id": "p2", "type": "paragraph", "text": "效率、质量、创意都被重新定义。"}
  ]
}
EOF

# 2. 上传
curl -X POST http://localhost:7072/api/v1/mbdoc \
  -H "Content-Type: application/json" \
  -d @/tmp/doc.json

# 3. 获取渲染后的 HTML
curl -sX POST "http://localhost:7072/api/v1/mbdoc/demo-001/render" | jq -r .data.html
```

### Stage 1 限制（已知）

- `markdown` / `html` / `image` / `svg` / `raster` 这 5 种 block 都是 stub
- `render` 端点返回的 HTML 还不能直接复制到微信（Stage 2 之后才有真实的 inline-styled 输出）
- 前端编辑器仍是旧 `/articles` 界面；MBDoc 目前**只能通过 API 操作**
- 不要在同一个项目中混用 `/articles` 和 `/mbdoc`，它们是两套独立存储

### 什么时候用哪套 API？

| 场景 | 推荐 |
|---|---|
| AI Agent 通过 CLI 生产文章（Stage 1+） | `/mbdoc` |
| 程序员手写 HTML 直接推送草稿箱（现在） | `/articles` |
| 运营者在 Web 编辑器里操作（现在） | `/articles` |
| Stage 6 起 | 全部 `/mbdoc`，`/articles` 下线 |
```

- [ ] **Step 2: 提交**

Run:
```bash
cd D:/Web/MBEditor
git add skill/mbeditor.skill.md
git commit -m "docs(skill): stage 1 — add MBDoc schema and /api/v1/mbdoc endpoints"
```

---

## Task 9: 最终验证与合并

- [ ] **Step 1: 跑所有测试**

Run:
```bash
cd D:/Web/MBEditor/backend && pytest -v
cd D:/Web/MBEditor/frontend && npm test
cd D:/Web/MBEditor/frontend && npm run build
```
Expected: all green.

- [ ] **Step 2: DoD 清单验证**

Run each command:
```bash
cd D:/Web/MBEditor
# 新模型和服务文件存在
test -f backend/app/models/mbdoc.py && echo "mbdoc model OK"
test -f backend/app/services/block_registry.py && echo "registry OK"
test -f backend/app/services/render_for_wechat.py && echo "render entry OK"
test -f backend/app/api/v1/mbdoc.py && echo "api OK"

# 旧端点仍在
grep -q "from app.api.v1 import articles" backend/app/api/v1/router.py && echo "legacy articles still wired"
grep -q "from app.api.v1 import publish" backend/app/api/v1/router.py && echo "legacy publish still wired"
```
Expected: all 6 lines echo OK messages.

- [ ] **Step 3: 端到端冒烟**

Run:
```bash
cd D:/Web/MBEditor/backend
uvicorn app.main:app --port 7072 &
sleep 3

# Create
curl -sX POST http://localhost:7072/api/v1/mbdoc \
  -H "Content-Type: application/json" \
  -d '{"id":"smoke-1","version":"1","meta":{"title":"Smoke"},"blocks":[{"id":"h1","type":"heading","level":1,"text":"Hello"},{"id":"p1","type":"paragraph","text":"World"}]}'

# Get
curl -s http://localhost:7072/api/v1/mbdoc/smoke-1 | head -c 300
echo ""

# Render
curl -sX POST "http://localhost:7072/api/v1/mbdoc/smoke-1/render?upload_images=false" | head -c 300
echo ""

# Delete
curl -sX DELETE http://localhost:7072/api/v1/mbdoc/smoke-1

kill %1 2>/dev/null || true
```
Expected: create returns `{"code":0,...}`, get returns the doc, render returns `{"code":0,"data":{"html":"<h1 style=...>Hello</h1>\n<p style=...>World</p>"`, delete returns ok.

- [ ] **Step 4: 合并**

Run:
```bash
cd D:/Web/MBEditor
git checkout main 2>/dev/null || git checkout master
git merge --no-ff stage-1/block-registry -m "feat: stage 1 — BlockRegistry and MBDoc API"
```

- [ ] **Step 5: 标记完成**

Edit `docs/superpowers/plans/2026-04-11-mbeditor-wysiwyg-roadmap.md` §2, 将 Stage 1 的"详细计划"列从 `✅ 已细化` 改为 `✅ 完成 (YYYY-MM-DD)`。

Run:
```bash
cd D:/Web/MBEditor
git add docs/superpowers/plans/2026-04-11-mbeditor-wysiwyg-roadmap.md
git commit -m "docs(roadmap): mark stage 1 as complete"
```

---

## Rollback 预案

若任意 Task 之后发现问题难以修复：
```bash
cd D:/Web/MBEditor
git checkout main 2>/dev/null || git checkout master
git branch -D stage-1/block-registry
```

旧 `/articles` 路线完全不受影响，回滚无副作用。

---

## 已知遗留项（Stage 2+ 解决）

- `markdown` / `html` / `image` / `svg` / `raster` 5 种 block 是 stub，渲染出的是黄色警告框
- `render?upload_images=true` 还没有真实的图片上传逻辑（Stage 3）
- 前端 Editor 页面完全没变（Stage 6 才迁移到 MBDoc）
- `/articles` 和 `/mbdoc` 是两套独立存储，没有数据迁移工具
- MBDoc storage 没有并发锁（两个同时 PUT 会有竞争），Stage 6 前认为单用户单机，不处理
