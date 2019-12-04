package uk.co.electronstudio.mobcontrol;

import com.badlogic.gdx.controllers.Controller;


import javax.swing.*;
import java.awt.*;
import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.Arrays;

import static uk.co.electronstudio.mobcontrol.MobController.SDL_CONTROLLER_AXIS_MAX;
import static uk.co.electronstudio.mobcontrol.MobController.SDL_CONTROLLER_BUTTON_MAX;

/**
 * A quick and dirty interface to check if a controller is working. I hope you like swing!
 */
public class MobTest {
    public static int NUM_CONTROLLERS = 5;
    public static MobControllerManager controllerManager;
    public volatile static boolean requestRestart = false;


    public static void main(String[] args) {
        init();


        JTabbedPane tabbedPane = new JTabbedPane();
        JFrame testFrame = new JFrame();
        SDLInfoPanel[] controllerTabs = setup(tabbedPane, testFrame);

        try {
            Desktop.getDesktop().browse(new URI("http://localhost"));
        } catch (IOException e) {
            e.printStackTrace();
        } catch (URISyntaxException e) {
            e.printStackTrace();
        }

        while (true) {
            mainLoop(testFrame, controllerTabs);
        }
    }

    private static void init() {

        try {
            controllerManager = new MobControllerManager();
            controllerManager.start();
        } catch (MalformedURLException e) {
            e.printStackTrace();
        } catch (URISyntaxException e) {
            e.printStackTrace();
        }
    }

    private static void mainLoop(JFrame testFrame, SDLInfoPanel[] controllerTabs) {
        if (requestRestart) {
            controllerManager.close();
            init();
            requestRestart = false;
        }
        try {
            Thread.sleep(10);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        try {
            controllerManager.pollState();
        } catch (Exception sdl_error) {
            sdl_error.printStackTrace();
        }
        for (int i = 0; i < controllerManager.getControllers().size; i++) {
            Controller controllerAtIndex = controllerManager.getControllers().get(i);
            controllerTabs[i].updatePanel((MobController) controllerAtIndex);
        }
        testFrame.repaint();
    }

    private static SDLInfoPanel[] setup(JTabbedPane tabbedPane, JFrame testFrame) {
        testFrame.setDefaultCloseOperation(WindowConstants.EXIT_ON_CLOSE);
        testFrame.setLocationRelativeTo(null);
        testFrame.setMinimumSize(new Dimension(1000, 350));
        testFrame.setResizable(true);
        testFrame.setVisible(true);

        SDLInfoPanel[] controllerTabs = new SDLInfoPanel[NUM_CONTROLLERS];
        for (int i = 0; i < NUM_CONTROLLERS; i++) {
            controllerTabs[i] = new SDLInfoPanel();
            tabbedPane.add("   Controller " + (i + 1) + "   ", controllerTabs[i]);
        }
        tabbedPane.add("Options", new OptionPanel());
        testFrame.setContentPane(tabbedPane);
        return controllerTabs;
    }

    private static void rumbleExample(MobControllerManager controllerManager) {
        MobController controller = (MobController) controllerManager.getControllers().get(0);
        controller.rumble(1.0f, 1.0f, 500);
    }

    private static void reflectionExample(MobControllerManager controllerManager) {
        Method method = null;
        Controller controller = controllerManager.getControllers().get(0);
        for (Method m : controller.getClass().getMethods()) {
            if (m.getName().equals("rumble")) method = m;
        }
        try {
            method.invoke(controller, 1f, 1f, 500);
        } catch (IllegalAccessException | InvocationTargetException e) {
            e.printStackTrace();
        }
    }

    /**
     * A JPanel that displays information about a given ControllerIndex.
     */
    public static class SDLInfoPanel extends JPanel {
        private JPanel title;
        private JPanel axes;
        private JPanel buttons;
        private JPanel pov;
        private JSlider leftRumble, rightRumble;
        private JButton vibrateButton;
        private JLabel titleLabel;

        public SDLInfoPanel() {
            setLayout(new BorderLayout());

            title = new JPanel();
            axes = new JPanel();
            buttons = new JPanel();
            pov = new JPanel();

            JPanel vibratePanel = new JPanel();
            vibrateButton = new JButton("Rumble");
            leftRumble = new JSlider(0, 100, 100);
            rightRumble = new JSlider(0, 100, 100);

            vibratePanel.add(leftRumble);
            vibratePanel.add(rightRumble);
            vibratePanel.add(vibrateButton);


            title.setLayout(new BoxLayout(title, BoxLayout.Y_AXIS));
            title.setAlignmentX(Component.CENTER_ALIGNMENT);
            titleLabel = new JLabel();
            title.add(titleLabel);

            JPanel middlePanel = new JPanel();
            middlePanel.setLayout(new BoxLayout(middlePanel, BoxLayout.Y_AXIS));
            middlePanel.add(title);
            middlePanel.add(axes);
            middlePanel.add(pov);
            middlePanel.add(buttons);

            add(middlePanel);
            add(vibratePanel, BorderLayout.SOUTH);
        }

        public void updatePanel(MobController c) {
            try {
                titleLabel.setText(c.getName());

                axes.removeAll();
                for (int i = 0; i < SDL_CONTROLLER_AXIS_MAX; i++) {
                    JLabel label = new JLabel();
                    label.setPreferredSize(new Dimension(100, 30));
                    label.setText(c.getAxisName(i));//SDL.SDL_GameControllerGetStringForAxis(i));

                    JProgressBar progressBar = new JProgressBar(-100, 100);
                    progressBar.setPreferredSize(new Dimension(200, 30));
                    progressBar.setValue((int) (c.getAxis(i) * 100));

                    JPanel axisPanel = new JPanel();
                    axisPanel.setLayout(new BoxLayout(axisPanel, BoxLayout.X_AXIS));
                    axisPanel.add(label);
                    axisPanel.add(progressBar);
                    axes.add(axisPanel);
                }

                buttons.removeAll();
                for (int i = 0; i < SDL_CONTROLLER_BUTTON_MAX; i++) {
                    JButton button = new JButton(c.getButtonName(i));
                    button.setEnabled(c.getButton(i));
                    buttons.add(button);
                }

                Arrays.stream(vibrateButton.getActionListeners()).forEach(vibrateButton::removeActionListener);
                vibrateButton.addActionListener(event -> {
                    c.rumble(leftRumble.getValue() / 100f, rightRumble.getValue() / 100f, 1000);

                });

                pov.removeAll();
                pov.add(new JLabel(c.getPov(0).toString()));

            } catch (Exception e) {
                e.printStackTrace();

                titleLabel.setText("SDL error occurred!");
                axes.removeAll();
                buttons.removeAll();

                axes.add(new JLabel(e.getMessage()));
            }
        }

        public void setAsDisconnected() {
            titleLabel.setText("No controller connected at this index!");
            axes.removeAll();
            buttons.removeAll();
        }
    }

    public static class OptionPanel extends JPanel {
        private JPanel title;

        private JButton restartButton;
        private JLabel titleLabel;

        public OptionPanel() {
            setLayout(new BorderLayout());

            title = new JPanel();


            JPanel panel = new JPanel();
//            restartButton = new JButton("Restart SDL");
//            restartButton.addActionListener(new ActionListener() {
//                @Override
//                public void actionPerformed(ActionEvent e) {
//                    requestRestart = true;
//                }
//            });
//
//
//            panel.add(restartButton);
//            panel.add(xinput);
//
//
//            title.setLayout(new BoxLayout(title, BoxLayout.Y_AXIS));
//            title.setAlignmentX(Component.CENTER_ALIGNMENT);
//            titleLabel = new JLabel();
//            title.add(titleLabel);
//
//            JPanel middlePanel = new JPanel();
//            middlePanel.setLayout(new BoxLayout(middlePanel, BoxLayout.Y_AXIS));
//            middlePanel.add(title);
//
//
//            add(middlePanel);
//            add(panel, BorderLayout.SOUTH);
        }


    }

}
