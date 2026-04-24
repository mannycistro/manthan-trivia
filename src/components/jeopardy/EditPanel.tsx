import { GameSettings, MediaType, Question, Round } from "@/types/jeopardy";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Download, Upload, X } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

const CATEGORY_FONT_OPTIONS = [
  "Montserrat",
  "Inter",
  "Poppins",
  "Oswald",
  "Bebas Neue",
  "Anton",
  "Roboto Condensed",
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rounds: Round[];
  activeRoundIndex: number;
  onChangeRound: (idx: number) => void;
  round: Round;
  onUpdateCategoryTitle: (id: string, title: string) => void;
  onUpdateQuestion: (categoryId: string, questionId: string, patch: Partial<Question>) => void;
  onResetBoard: () => void;
  onResetAll: () => void;
  onResetGame: () => void;
  onExport: () => void;
  onImport: (json: string) => void;
  settings: GameSettings;
  onUpdateSettings: (patch: Partial<GameSettings>) => void;
}

export function EditPanel({
  open,
  onOpenChange,
  rounds,
  activeRoundIndex,
  onChangeRound,
  round,
  onUpdateCategoryTitle,
  onUpdateQuestion,
  onResetBoard,
  onResetAll,
  onResetGame,
  onExport,
  onImport,
  settings,
  onUpdateSettings,
}: Props) {
  const importRef = useRef<HTMLInputElement>(null);

  const handleMediaUpload = (
    categoryId: string,
    questionId: string,
    file: File,
    expectedType: "image" | "audio" | "video"
  ) => {
    if (file.size > 25 * 1024 * 1024) {
      toast.error("File too large (max 25MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onUpdateQuestion(categoryId, questionId, {
        mediaType: expectedType,
        mediaUrl: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        onImport(reader.result as string);
        toast.success("Game imported");
      } catch {
        toast.error("Invalid game file");
      }
    };
    reader.readAsText(file);
  };

  const categories = round.categories;
  const cols = Math.max(1, categories.length);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-primary">Edit Game</DialogTitle>
          <DialogDescription>
            Edit categories, questions, answers, and media for the selected round. Changes save
            automatically.
          </DialogDescription>
        </DialogHeader>

        {/* Round selector + actions */}
        <div className="flex flex-wrap gap-2 mb-2 items-center">
          <Label className="text-sm">Round:</Label>
          <Select
            value={String(activeRoundIndex)}
            onValueChange={(v) => onChangeRound(Number(v))}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {rounds.map((r, i) => (
                <SelectItem key={r.id} value={String(i)}>
                  {r.name || `Round ${i + 1}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex-1" />

          <Button variant="secondary" size="sm" onClick={onExport}>
            <Download className="w-4 h-4 mr-1" /> Export JSON
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => importRef.current?.click()}
          >
            <Upload className="w-4 h-4 mr-1" /> Import JSON
          </Button>
          <input
            ref={importRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImportFile(f);
              e.target.value = "";
            }}
          />
          <Button variant="outline" size="sm" onClick={onResetBoard}>
            Reset This Round
          </Button>
          <Button variant="outline" size="sm" onClick={onResetAll}>
            Reset All Rounds
          </Button>
          <Button variant="destructive" size="sm" onClick={onResetGame}>
            Reset to Default Game
          </Button>
        </div>

        <Tabs defaultValue={categories[0]?.id} key={round.id} className="w-full">
          <TabsList
            className="grid w-full"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {categories.map((c) => (
              <TabsTrigger key={c.id} value={c.id} className="truncate">
                {c.title || "Category"}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((cat) => (
            <TabsContent key={cat.id} value={cat.id} className="space-y-4 mt-4">
              <div>
                <Label>Category Title</Label>
                <Textarea
                  value={cat.title}
                  onChange={(e) => onUpdateCategoryTitle(cat.id, e.target.value)}
                  rows={2}
                  className="font-display text-lg"
                />
              </div>

              {cat.questions.map((q) => (
                <div
                  key={q.id}
                  className="border-2 border-border rounded-xl p-4 space-y-3 bg-background/50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-2xl text-primary">
                      {q.value}
                    </span>
                    <Input
                      type="number"
                      value={q.value}
                      onChange={(e) =>
                        onUpdateQuestion(cat.id, q.id, { value: Number(e.target.value) || 0 })
                      }
                      className="w-32"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <Label>Question</Label>
                      <Textarea
                        value={q.question}
                        onChange={(e) =>
                          onUpdateQuestion(cat.id, q.id, { question: e.target.value })
                        }
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label>Answer</Label>
                      <Textarea
                        value={q.answer}
                        onChange={(e) =>
                          onUpdateQuestion(cat.id, q.id, { answer: e.target.value })
                        }
                        rows={4}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-[180px_1fr_auto] gap-3 items-end">
                    <div>
                      <Label>Media Type</Label>
                      <Select
                        value={q.mediaType}
                        onValueChange={(v) =>
                          onUpdateQuestion(cat.id, q.id, {
                            mediaType: v as MediaType,
                            mediaUrl: v === "none" ? undefined : q.mediaUrl,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="image">Image</SelectItem>
                          <SelectItem value="video">Video (YouTube or file)</SelectItem>
                          <SelectItem value="audio">Audio</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {q.mediaType !== "none" && (
                      <>
                        <div>
                          <Label>
                            {q.mediaType === "video"
                              ? "YouTube URL or upload"
                              : "Upload or paste URL"}
                          </Label>
                          <Input
                            placeholder={
                              q.mediaType === "video"
                                ? "https://youtube.com/watch?v=..."
                                : "Paste URL or use upload →"
                            }
                            value={
                              q.mediaUrl?.startsWith("data:") ? "[uploaded file]" : q.mediaUrl || ""
                            }
                            onChange={(e) =>
                              onUpdateQuestion(cat.id, q.id, { mediaUrl: e.target.value })
                            }
                            disabled={q.mediaUrl?.startsWith("data:")}
                          />
                        </div>
                        <div className="flex gap-1">
                          <FileUploadButton
                            accept={
                              q.mediaType === "image"
                                ? "image/*"
                                : q.mediaType === "audio"
                                ? "audio/*"
                                : "video/*"
                            }
                            onFile={(f) =>
                              handleMediaUpload(
                                cat.id,
                                q.id,
                                f,
                                q.mediaType as "image" | "audio" | "video"
                              )
                            }
                          />
                          {q.mediaUrl && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() =>
                                onUpdateQuestion(cat.id, q.id, { mediaUrl: undefined })
                              }
                              aria-label="Clear media"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function FileUploadButton({
  accept,
  onFile,
}: {
  accept: string;
  onFile: (f: File) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => ref.current?.click()}>
        <Upload className="w-4 h-4 mr-1" /> Upload
      </Button>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
    </>
  );
}
