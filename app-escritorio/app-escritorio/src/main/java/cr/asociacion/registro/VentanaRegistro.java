package cr.asociacion.registro;

import javax.swing.*;
import java.awt.*;
import java.sql.SQLIntegrityConstraintViolationException;
import java.util.Arrays;
import java.util.concurrent.ExecutionException;
import java.util.regex.Pattern;

public class VentanaRegistro extends JFrame {

    private static final String DOMINIO = "@asociaciondeemprendedorescr.com";
    private static final Pattern PATRON_EMAIL =
            Pattern.compile("^[a-z0-9._%+-]+@asociaciondeemprendedorescr\\.com$");
    private static final int LARGO_MIN_CLAVE = 8;
    private static final int LARGO_MAX_CLAVE = 72; // bcrypt ignora lo que pase de 72 bytes

    private final JTextField txtEmail = new JTextField(25);
    private final JPasswordField txtClave = new JPasswordField(25);
    private final JCheckBox chkMostrar = new JCheckBox("Mostrar contraseña");
    private final JComboBox<String> cmbRol =
            new JComboBox<>(new String[]{"empleado", "administrador", "emprendedor"});
    private final JButton btnRegistrar = new JButton("Registrar usuario");

    private final UsuarioDAO dao = new UsuarioDAO();

    public VentanaRegistro() {
        super("Registro de usuarios - Asociación de Emprendedores CR");
        setDefaultCloseOperation(EXIT_ON_CLOSE);

        JPanel panel = new JPanel(new GridBagLayout());
        panel.setBorder(BorderFactory.createEmptyBorder(20, 24, 20, 24));
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(6, 6, 6, 6);
        gbc.anchor = GridBagConstraints.WEST;
        gbc.fill = GridBagConstraints.HORIZONTAL;

        JLabel titulo = new JLabel("Nuevo usuario");
        titulo.setFont(titulo.getFont().deriveFont(Font.BOLD, 18f));
        gbc.gridx = 0; gbc.gridy = 0; gbc.gridwidth = 2;
        panel.add(titulo, gbc);

        gbc.gridwidth = 1;
        gbc.gridy = 1; gbc.gridx = 0;
        panel.add(new JLabel("Correo de empresa:"), gbc);
        gbc.gridx = 1;
        panel.add(txtEmail, gbc);

        gbc.gridy = 2; gbc.gridx = 0;
        panel.add(new JLabel("Contraseña provisional:"), gbc);
        gbc.gridx = 1;
        panel.add(txtClave, gbc);

        gbc.gridy = 3; gbc.gridx = 1;
        panel.add(chkMostrar, gbc);

        gbc.gridy = 4; gbc.gridx = 0;
        panel.add(new JLabel("Rol:"), gbc);
        gbc.gridx = 1;
        panel.add(cmbRol, gbc);

        gbc.gridy = 5; gbc.gridx = 0; gbc.gridwidth = 2;
        gbc.insets = new Insets(16, 6, 6, 6);
        panel.add(btnRegistrar, gbc);

        chkMostrar.addActionListener(e ->
                txtClave.setEchoChar(chkMostrar.isSelected() ? (char) 0 : '•'));
        btnRegistrar.addActionListener(e -> registrar());
        getRootPane().setDefaultButton(btnRegistrar);

        setContentPane(panel);
        pack();
        setResizable(false);
        setLocationRelativeTo(null);
    }

    private String validar(String email, String clave) {
        if (email.isEmpty() || clave.isEmpty()) {
            return "Completa el correo y la contraseña.";
        }
        if (!PATRON_EMAIL.matcher(email).matches()) {
            return "El correo debe tener el formato nombre" + DOMINIO + ".";
        }
        if (clave.length() < LARGO_MIN_CLAVE) {
            return "La contraseña debe tener al menos " + LARGO_MIN_CLAVE + " caracteres.";
        }
        if (clave.length() > LARGO_MAX_CLAVE) {
            return "La contraseña no puede superar los " + LARGO_MAX_CLAVE + " caracteres.";
        }
        return null;
    }

    private void registrar() {
        // El sitio de empleados busca el correo en minúsculas, así que se guarda así
        final String email = txtEmail.getText().trim().toLowerCase();
        char[] caracteres = txtClave.getPassword();
        final String clave = new String(caracteres);
        Arrays.fill(caracteres, '\0');
        final String rol = (String) cmbRol.getSelectedItem();

        String error = validar(email, clave);
        if (error != null) {
            JOptionPane.showMessageDialog(this, error, "Datos inválidos", JOptionPane.WARNING_MESSAGE);
            return;
        }

        btnRegistrar.setEnabled(false);

        // La operación se hace fuera del hilo de la interfaz para que la ventana no se congele
        new SwingWorker<Void, Void>() {
            @Override
            protected Void doInBackground() throws Exception {
                dao.registrar(email, clave, rol);
                return null;
            }

            @Override
            protected void done() {
                btnRegistrar.setEnabled(true);
                try {
                    get();
                    JOptionPane.showMessageDialog(VentanaRegistro.this,
                            "Usuario registrado correctamente:\n" + email + " (" + rol + ")",
                            "Éxito", JOptionPane.INFORMATION_MESSAGE);
                    txtEmail.setText("");
                    txtClave.setText("");
                    cmbRol.setSelectedIndex(0);
                    txtEmail.requestFocus();
                } catch (ExecutionException ex) {
                    Throwable causa = ex.getCause();
                    String mensaje = (causa instanceof SQLIntegrityConstraintViolationException)
                            ? "Ya existe un usuario registrado con ese correo."
                            : "No se pudo registrar el usuario:\n" + causa.getMessage();
                    JOptionPane.showMessageDialog(VentanaRegistro.this,
                            mensaje, "Error", JOptionPane.ERROR_MESSAGE);
                } catch (InterruptedException ex) {
                    Thread.currentThread().interrupt();
                }
            }
        }.execute();
    }
}