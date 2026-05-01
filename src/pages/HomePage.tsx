import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, Pencil, Trash2, Copy, Plus } from "lucide-react";
import {
  loadAllBoards,
  saveAllBoards,
  createNewBoard,
  duplicateBoard,
  deleteBoard,
  setActiveBoardId,
  StoredBoard,
} from "@/lib/boardStorage";

const HomePage = () => {
  const navigate = useNavigate();
  const [boards, setBoards] = useState<StoredBoard[]>(loadAllBoards);

  const refresh = () => setBoards(loadAllBoards());

  const handlePlay = (id: string) => {
    setActiveBoardId(id);
    navigate("/play");
  };

  const handleEdit = (id: string) => {
    setActiveBoardId(id);
    navigate("/edit");
  };

  const handleCreateNew = () => {
    const board = createNewBoard();
    const all = [...boards, board];
    saveAllBoards(all);
    setActiveBoardId(board.id);
    setBoards(all);
    navigate("/edit");
  };

  const handleDuplicate = (id: string) => {
    const src = boards.find((b) => b.id === id);
    if (!src) return;
    const copy = duplicateBoard(src);
    const all = [...boards, copy];
    saveAllBoards(all);
    setBoards(all);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Delete this board? This cannot be undone.")) return;
    deleteBoard(id);
    refresh();
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl md:text-4xl gold-gradient text-shadow-jeopardy">
            Board Manager
          </h1>
          <Button onClick={handleCreateNew} className="font-bold">
            <Plus className="w-4 h-4 mr-2" /> New Board
          </Button>
        </div>

        {boards.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg mb-4">No boards yet. Create your first one!</p>
            <Button onClick={handleCreateNew} size="lg" className="font-bold">
              <Plus className="w-5 h-5 mr-2" /> Create Board
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {boards
              .slice()
              .sort((a, b) => b.updatedAt - a.updatedAt)
              .map((board) => (
              <div
                key={board.id}
                className="flex items-center justify-between p-4 rounded-lg bg-card border border-border hover:border-primary/40 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold text-foreground truncate">
                    {board.gameName}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {board.rounds.length} round{board.rounds.length !== 1 ? "s" : ""} ·{" "}
                    {board.rounds.reduce((s, r) => s + r.categories.length, 0)} categories
                    {board.updatedAt && (
                      <> · Updated {new Date(board.updatedAt).toLocaleDateString()}</>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <Button size="sm" variant="default" onClick={() => handlePlay(board.id)} className="font-bold">
                    <Play className="w-4 h-4 mr-1" /> Play
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => handleEdit(board.id)} className="font-bold">
                    <Pencil className="w-4 h-4 mr-1" /> Edit
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDuplicate(board.id)} aria-label="Duplicate">
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(board.id)}
                    aria-label="Delete"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
