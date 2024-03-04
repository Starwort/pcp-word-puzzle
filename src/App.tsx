import {JSX, Show, createEffect, createSignal, type Component} from 'solid-js';

import {InfoOutlined, Share} from '@suid/icons-material';
import {Alert, AppBar, Box, CssBaseline, IconButton, SvgIcon, ThemeProvider, Toolbar, Typography, createTheme, useMediaQuery} from '@suid/material';
import {SvgIconProps} from '@suid/material/SvgIcon';
import LeaderLine from 'leader-line-new';
import {tabbable} from 'tabbable';
import './App.scss';
import LinkButton from './LinkButton';
import {ArrowSets, generateArrowSets} from './arrow_sets';
import {COLOURS} from './colours';
import {generatePuzzle, puzzleFromString, serialise, validatePuzzleSolution} from './puzzle_generator';
import {makeRandom} from './random';

const App: Component = () => {
    const query = new URLSearchParams(window.location.search);
    const [error, setError] = createSignal('');
    let arrows: ArrowSets, clues: string[], outputCount, answerHash: string;
    const randomSeed = Math.floor(new Date() as any / 8.64e7);
    const random = makeRandom(randomSeed);
    if (query.has('puzzle')) {
        try {
            [arrows, clues, outputCount, answerHash] = puzzleFromString(
                query.get('puzzle')!
            );
        } catch (_error) {
            let error: Error = _error as any;
            setError(error.message);
            arrows = generateArrowSets(random);
            [clues, outputCount, answerHash] = generatePuzzle(arrows, random);
        }
    } else {
        arrows = generateArrowSets(random);
        [clues, outputCount, answerHash] = generatePuzzle(arrows, random);
    }
    const [outputValues, setOutputValues] = createSignal<string[]>(
        Array.from({length: outputCount}).map(_ => ''), {equals: false}
    );
    const outputs: Element[] = [];
    const shiftFocus = (by = 1) => {
        const inputs = tabbable(document.documentElement);
        const thisInput = inputs.findIndex(
            (e) => e === document.activeElement,
        );
        const next = inputs[thisInput + by];
        next?.focus();
    };
    const makeKeyEventHandler = (i: number): JSX.EventHandler<HTMLInputElement, KeyboardEvent> => (event) => {
        if (event.key === 'Unidentified') return; // doesn't work on mobile
        if (event.isComposing || event.keyCode === 229) return;
        if (event.key === 'Backspace') {
            if ((event.target as HTMLInputElement).value.length === 0) {
                shiftFocus(-1);
            }
            return;
        }
        if (event.key === 'Left' || event.key === 'ArrowLeft') {
            shiftFocus(-1);
            return;
        } else if (event.key === 'Right' || event.key === 'ArrowRight') {
            shiftFocus();
            return;
        }
    };
    const makeInputEventHandler = (i: number): JSX.InputEventHandler<HTMLInputElement, InputEvent> => (event) => {
        let value = event.target.value;
        if (value.length > 1) {
            value = value[value.length - 1];
        }
        setOutputValues(outputValues => {
            outputValues[i] = value.toUpperCase();
            return outputValues;
        });
        if (event.target.value.length != 0) {
            shiftFocus();
        }
    };
    for (let i = 0; i < outputCount; i++) {
        let input: Element = <input
            value={outputValues()[i]}
            onKeyDown={makeKeyEventHandler(i)}
            onInput={makeInputEventHandler(i)}
        /> as any;
        outputs.push(input);
    }
    const inputs: Element[] = [];
    for (let i = 0; i < Object.keys(arrows).length; i++) {
        let targets = arrows[i];
        let element = <div>
            <Box sx={{
                display: 'flex',
                flexDirection: {xs: 'column', md: 'row-reverse'},
                alignItems: 'center',
            }}>
                <div class="clue">
                    {clues[i]}
                </div>
                <div class="row">
                    {targets.map(i => <input
                        value={outputValues()[i]}
                        onKeyDown={makeKeyEventHandler(i)}
                        onInput={makeInputEventHandler(i)}
                    />)}
                </div>
            </Box>
        </div>;
        inputs.push(element as any);
    }
    const theme = createTheme({palette: {mode: 'dark'}});
    createEffect((oldLines: LeaderLine[]) => {
        for (let line of oldLines) {
            line.hide();
            line.remove();
        }
        // subscribe to the signals that draw banners
        let _: any = won();
        _ = error();
        const lines = [];
        const isLarge = useMediaQuery(theme.breakpoints.up('md'));
        for (let i = 0; i < Object.keys(arrows).length; i++) {
            let targets = arrows[i];
            for (let target of targets) {
                let source = inputs[i];
                if (!isLarge()) {
                    source = source.querySelector('.row')!;
                }
                lines.push(new LeaderLine(
                    source, outputs[target],
                    {
                        path: 'straight',
                        endPlug: 'arrow3',
                        color: COLOURS[i % COLOURS.length],
                        startSocket: 'right',
                        endSocket: 'left',
                    }
                ));
            }
        }
        return lines;
    }, []);
    const [won, setWon] = createSignal(false);
    createEffect(() => {
        if (validatePuzzleSolution(outputValues().join(''), answerHash)) {
            setWon(true);
        }
    });

    return <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppBar>
            <Toolbar sx={{gap: 1}}>
                <Typography variant='h5' component='h1' sx={{
                    flexGrow: 1,
                }}>
                    Tangleword
                </Typography>
                <LinkButton href="https://www.theguardian.com/science/2024/mar/03/can-you-solve-it-the-word-game-at-the-cutting-edge-of-computer-science">
                    <InfoOutlined />
                </LinkButton>
                <IconButton
                    color='inherit'
                    onClick={() => {
                        const url = new URL(window.location.href);
                        url.searchParams.set('puzzle', serialise(
                            arrows, clues, answerHash
                        ));
                        navigator.clipboard.writeText(decodeURIComponent(url.href));
                    }}
                    title="Share this puzzle"
                >
                    <Share />
                </IconButton>
                <LinkButton href="https://github.com/Starwort/tangleword">
                    <GitHub />
                </LinkButton>
            </Toolbar>
        </AppBar>
        <Toolbar />
        <main>
            <Show when={error()}>
                <Alert severity="error">{error()}</Alert>
            </Show>
            <Show when={won()}>
                <Alert severity="success">You won!</Alert>
            </Show>
            <div class="puzzle">
                <div class="column">
                    {inputs}
                </div>
                <div class="spacer"></div>
                <div class="column">
                    {outputs}
                </div>
            </div>
        </main>
    </ThemeProvider>;
};

function GitHub(props: SvgIconProps) {
    return <SvgIcon {...props}>
        <path d="M12 1.27a11 11 0 00-3.48 21.46c.55.09.73-.28.73-.55v-1.84c-3.03.64-3.67-1.46-3.67-1.46-.55-1.29-1.28-1.65-1.28-1.65-.92-.65.1-.65.1-.65 1.1 0 1.73 1.1 1.73 1.1.92 1.65 2.57 1.2 3.21.92a2 2 0 01.64-1.47c-2.47-.27-5.04-1.19-5.04-5.5 0-1.1.46-2.1 1.2-2.84a3.76 3.76 0 010-2.93s.91-.28 3.11 1.1c1.8-.49 3.7-.49 5.5 0 2.1-1.38 3.02-1.1 3.02-1.1a3.76 3.76 0 010 2.93c.83.74 1.2 1.74 1.2 2.94 0 4.21-2.57 5.13-5.04 5.4.45.37.82.92.82 2.02v3.03c0 .27.1.64.73.55A11 11 0 0012 1.27" />,
    </SvgIcon>;
}

export default App;
