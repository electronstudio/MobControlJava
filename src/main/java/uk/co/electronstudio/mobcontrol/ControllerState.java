package uk.co.electronstudio.mobcontrol;

import static uk.co.electronstudio.mobcontrol.MobController.SDL_CONTROLLER_AXIS_MAX;
import static uk.co.electronstudio.mobcontrol.MobController.SDL_CONTROLLER_BUTTON_MAX;


/* Immutable wrapper for the state arrays to ensure they can only be written once on creation */
public class ControllerState {
    final private float[] axisState;
    final private boolean[] buttonState;
    public ControllerState(){
        axisState = new float[SDL_CONTROLLER_AXIS_MAX];
        buttonState = new boolean[SDL_CONTROLLER_BUTTON_MAX];
    }
    public ControllerState(float[] axis, boolean[] button){
        axisState = axis;
        buttonState = button;
    }

    public float getAxis(int i){
        return axisState[i];
    }

    public boolean getButton(int i){
        return buttonState[i];
    }
}
