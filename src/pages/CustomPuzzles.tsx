import {List, ListItem, ListItemButton, ListItemText} from "@suid/material";
import {PageProps} from "./PageProps";
const CUSTOM_PUZZLES: [string, string][] = [
    ["Guardian Example", "animal,0,3,6;verb,1,3,7;transportation,2,3,4;food,1,5,7;furniture,0,5,6;verb,2,4,7;000d8041d1d221b1"],
    ["Guardian Puzzle 1", "Great Dane,0,4,6;sponge,1,5,7;hook,2,5,6;appreciate,0,3,7;capacious,1,3,6;Edgar A,2,4,5;00188e1478c3610c"],
    ["Guardian Puzzle 2", "murder,0,4,6;exclamation,1,5,7;furnishing,2,5,6;pronoun,0,3,7;computer term,1,3,6;female name,2,4,5;001af2df7e03c484"],
    ["Guardian Puzzle 3", "time,0,4,6;captive,1,5,7;male name,2,5,6;noise,0,3,7;object,1,3,6;city,2,4,5;0009297419c64ad9"],
];

export function CustomPuzzles(props: PageProps) {
    return <>
        <List>
            {CUSTOM_PUZZLES.map(([name, puzzleDesc]) => <ListItem disablePadding>
                <ListItemButton
                    component="a"
                    href={window.location.pathname + "?puzzle=" + puzzleDesc}
                    onClick={event => {
                        event.preventDefault();
                        props.setPage("play", "puzzle=" + puzzleDesc);
                    }}
                >
                    <ListItemText primary={name} />
                </ListItemButton>
            </ListItem>)}
        </List>
    </>;
}