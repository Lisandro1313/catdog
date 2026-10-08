/**
 * Tipos mínimos de @3d-dice/dice-box (la librería no trae los suyos). Solo lo que usa la Generala.
 * https://fantasticdice.games/docs/usage/config
 */
declare module "@3d-dice/dice-box" {
  export type DadoTirado = { groupId: number; rollId: number; sides: number; value: number; theme?: string };

  export type ConfigDiceBox = {
    /** Selector CSS del contenedor ("#mesa"). */
    container?: string;
    /** Dónde están ammo.wasm y los temas, con barra al final. */
    assetPath: string;
    theme?: string;
    themeColor?: string;
    scale?: number;
    gravity?: number;
    throwForce?: number;
    spinForce?: number;
    startingHeight?: number;
    settleTimeout?: number;
    offscreen?: boolean;
    enableShadows?: boolean;
    lightIntensity?: number;
    id?: string;
  };

  export default class DiceBox {
    constructor(config: ConfigDiceBox);
    init(): Promise<DiceBox>;
    roll(notation: string | { qty: number; sides: number }): Promise<DadoTirado[]>;
    add(notation: string | { qty: number; sides: number | string }): Promise<DadoTirado[]>;
    remove(dados: { groupId: number; rollId: number }[]): Promise<DadoTirado[]>;
    reroll(dados: { groupId: number; rollId: number }[], opciones?: { remove?: boolean }): Promise<DadoTirado[]>;
    clear(): void;
    hide(): void;
    show(): void;
    resize(): void;
    getRollResults(): { id: number; rolls: DadoTirado[] }[];
    updateConfig(config: Partial<ConfigDiceBox>): void;
  }
}
