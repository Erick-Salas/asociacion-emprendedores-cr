package cr.asociacion.registro;

import javax.swing.*;

public class Main {
    public static void main(String[] args) {
        try {
            UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
        } catch (Exception ignorada) {
            // Si falla, se usa el aspecto por defecto de Swing
        }
        SwingUtilities.invokeLater(() -> new VentanaRegistro().setVisible(true));
    }
}